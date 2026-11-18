import net from 'node:net';
import { pathToFileURL } from 'node:url';

function read(principal, id) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({path: process.env.DOCUMENT_DESK_SOCKET});
    let text = '';
    socket.setEncoding('utf8');
    socket.setTimeout(15000, () => socket.destroy(new Error('local document desk timed out')));
    socket.once('error', reject);
    socket.once('connect', () => socket.write(JSON.stringify({principal, id}) + '\n'));
    socket.on('data', part => { text += part; });
    socket.once('end', () => {
      try {
        const reply = JSON.parse(text);
        if (reply.interfaceError) throw Error(reply.interfaceError);
        resolve(reply);
      } catch (error) { reject(error); }
    });
  });
}

export function readDocument(principal, id) { return read(principal, id); }
export function listDocuments(principal) { return read(principal, null); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [principal, id] = process.argv.slice(2);
  console.log(JSON.stringify(id ? await readDocument(principal, id) : await listDocuments(principal)));
}

