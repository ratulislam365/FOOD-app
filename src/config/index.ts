import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.join(__dirname, '../../.env') });


interface Config {
  env: string;
  port: number;
  mongodb: {
    uri: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };
}


const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/emdr-db'
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@emdr.com',
    fromName: process.env.FROM_NAME || 'EMDR Admin',
  }
};

export default config;
