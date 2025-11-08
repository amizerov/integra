import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Подтверждение email - АИС Интеграция МГУ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Подтверждение email</h2>
        <p>Здравствуйте!</p>
        <p>Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #B31B1B; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Подтвердить email
        </a>
        <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>Ссылка действительна в течение 24 часов.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Если вы не регистрировались в системе АИС Интеграция МГУ, проигнорируйте это письмо.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Восстановление пароля - АИС Интеграция МГУ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Восстановление пароля</h2>
        <p>Здравствуйте!</p>
        <p>Вы запросили восстановление пароля. Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #B31B1B; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Сбросить пароль
        </a>
        <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>Ссылка действительна в течение 1 часа.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
        </p>
      </div>
    `,
  })
}
