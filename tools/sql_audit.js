const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SQL_FILE = path.join(ROOT, 'database_complete.sql');
const REPORT_FILE = path.join(ROOT, 'tools', 'sql_audit_report.json');

function readSQL() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  return sql;
}

function parseSchema(sql) {
  const tables = {};
  // Match CREATE TABLE blocks (simple heuristic)
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`\"]?\w+[`\"]?)\s*\(([^;]+?)\)\s*(?:ENGINE|;)/gmi;
  let m;
  while ((m = createTableRegex.exec(sql)) !== null) {
    let tableName = m[1].replace(/[`\"]+/g, '');
    const colsBlock = m[2];
    const cols = [];
    const lines = colsBlock.split(/,\n/);
    for (let ln of lines) {
      ln = ln.trim();
      // ignore constraints lines
      if (!ln) continue;
      if (/^PRIMARY KEY|^FOREIGN KEY|^CONSTRAINT|^UNIQUE KEY|^INDEX|^KEY/i.test(ln)) continue;
      const colMatch = ln.match(/^([`\"]?\w+[`\"]?)\s+/);
      if (colMatch) {
        cols.push(colMatch[1].replace(/[`\"]/g, ''));
      }
    }
    tables[tableName] = cols;
  }
  return tables;
}

function listFiles(dir, pattern) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results.push(...listFiles(full, pattern));
    } else {
      if (!pattern || pattern.test(full)) results.push(full);
    }
  });
  return results;
}

function analyzeFiles(tables) {
  const backendDir = path.join(ROOT, 'backend');
  const filesAll = listFiles(backendDir, /\.js$/i);
  // Exclude node_modules and other large vendor folders to reduce noise
  const files = filesAll.filter(f => !/\\node_modules\\/.test(f) && !/\\dist\\/.test(f) && !/\\.git\\/.test(f));
  const report = {
    summary: { filesScanned: files.length, issues: 0 },
    files: {}
  };

  const tableNames = Object.keys(tables).map(t => t.toLowerCase());

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const issues = [];

    // Find SQL strings heuristically: look for SELECT/INSERT/UPDATE/DELETE occurrences
    const sqlRegex = /\b(SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,500}?;/gi;
    let m;
    const foundQueries = [];
    while ((m = sqlRegex.exec(content)) !== null) {
      const snippet = m[0];
      foundQueries.push(snippet);
      // find referenced tables: FROM, JOIN, INTO, UPDATE
      const tableRefs = [];
      const fromRe = /\bFROM\s+([\w`]+)/gi;
      const joinRe = /\bJOIN\s+([\w`]+)/gi;
      const intoRe = /\bINTO\s+([\w`]+)/gi;
      const updateRe = /\bUPDATE\s+([\w`]+)/gi;
      let mm;
      [fromRe, joinRe, intoRe, updateRe].forEach(re => {
        while ((mm = re.exec(snippet)) !== null) {
          tableRefs.push(mm[1].replace(/[`]/g, '').toLowerCase());
        }
      });

      for (const tref of tableRefs) {
        if (!tableNames.includes(tref)) {
          issues.push({ type: 'missing_table', table: tref, snippet: snippet.slice(0,200) });
        }
      }

      // detect template literal usage with interpolation near SQL keywords
      const templateSqlPattern = /`[^`]*(SELECT|INSERT|UPDATE|DELETE)[^`]*\${/i;
      if (templateSqlPattern.test(snippet)) {
        issues.push({ type: 'possible_injection_template_literal', detail: 'SQL appears in template literal with interpolation' });
      }

      // detect concatenation patterns building SQL
      const concatPattern = /\+\s*\w+|\w+\s*\+\s*['\"]/;
      if (concatPattern.test(snippet) && /SELECT|INSERT|UPDATE|DELETE/i.test(snippet)) {
        issues.push({ type: 'possible_injection_concat', detail: 'SQL string built with concatenation' });
      }
    }

    // Additionally find direct uses of conn.query/db.query with a non-parameterized string
    const paramPattern = /\.(query|execute)\s*\(\s*([`'\"])([\s\S]*?)\2\s*,\s*([\[\{])/g;
    let pp;
    while ((pp = paramPattern.exec(content)) !== null) {
      // query with params array/object - considered good
    }
    // detect query calls where second arg is missing (could be unsafe)
    const simpleQueryPattern = /\.(query|execute)\s*\(\s*([`'\"])([\s\S]*?)\2\s*\)/g;
    while ((pp = simpleQueryPattern.exec(content)) !== null) {
      const q = pp[3];
      if (/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(q)) {
        // flag queries that might lack params array
        issues.push({ type: 'query_without_params', snippet: q.slice(0,200) });
      }
    }

    if (foundQueries.length === 0) {
      // also search for shorter SQL fragments used without semicolon (common in template strings)
      const shortSqlRe = /(FROM|JOIN|WHERE)\s+\w+/gi;
      if (shortSqlRe.test(content)) {
        // nothing to do, just not empty
      }
    }

    if (issues.length) {
      report.summary.issues += issues.length;
      report.files[f] = { issues, queries: foundQueries.slice(0,10) };
    }
  }

  return report;
}

function main() {
  try {
    if (!fs.existsSync(SQL_FILE)) {
      console.error('No se encontró el archivo database_complete.sql en la raíz del repo.');
      process.exit(1);
    }
    const sql = readSQL();
    const tables = parseSchema(sql);
    const report = analyzeFiles(tables);
    fs.writeFileSync(REPORT_FILE, JSON.stringify({ tables, report }, null, 2), 'utf8');
    console.log('Auditoría completada. Archivo de informe:', REPORT_FILE);
    console.log('Resumen:', report.summary);
  } catch (err) {
    console.error('Error durante la auditoría:', err);
    process.exit(2);
  }
}

if (require.main === module) main();
