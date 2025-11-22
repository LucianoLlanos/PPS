function resetPasswordEmail(nombre, link, expiresInText = '1 hora') {
  const safeName = nombre ? String(nombre) : 'Usuario';
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#222;">
    <h2 style="color:#0b5cff;">Recuperación de contraseña</h2>
    <p>Hola ${safeName},</p>
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para continuar. El enlace expira en ${expiresInText}.</p>
    <p style="text-align:center; margin: 24px 0;"><a href="${link}" style="background:#0b5cff; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none;">Restablecer contraseña</a></p>
    <p>Si no pediste este restablecimiento, podés ignorar este correo.</p>
    <hr style="border:none; border-top:1px solid #eee; margin-top:20px;" />
    <p style="font-size:12px; color:#777;">Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
    <p style="word-break:break-all; font-size:12px; color:#777;">${link}</p>
  </div>
  `;
}

module.exports = { resetPasswordEmail };
