class BaseRepository {
  constructor(db) {
    this.db = db;
  }

  async hasColumn(table, column) {
    const sql = `
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1
    `;
    const rows = await this.db.query(sql, [table, column]);
    return rows && rows.length > 0;
  }
}

module.exports = { BaseRepository };
