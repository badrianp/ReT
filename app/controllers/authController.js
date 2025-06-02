import { validateUser, createUser } from '../models/userModel.js';
import { parseRequestBody } from '../../utils/bodyParser.js';

export async function handleLoginPost(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { username, password } = body;

    const isValid = await validateUser(username, password);

    if (isValid) {
      res.writeHead(200, {
        'Set-Cookie': `username=${username}; HttpOnly`,
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ username }));
    } else {
      res.writeHead(401);
      res.end();
    }
  } catch (error) {
    console.error('Eroare la login:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

export async function handleRegisterPost(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { username, password } = body;

    const success = await createUser(username, password);

    if (success) {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ username }));
    } else {
      res.writeHead(400);
      res.end();
    }
  } catch (error) {
    console.error('Eroare la inregistrare:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

export function handleLogout(req, res) {
  res.writeHead(200, {
    'Set-Cookie': 'username=; Max-Age=0'
  });
  res.end();
}