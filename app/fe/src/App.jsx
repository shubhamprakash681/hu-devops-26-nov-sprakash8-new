import React, { useCallback, useEffect, useState } from 'react';
import { addItem, deleteItem, health, listItems, login } from './api.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  const run = useCallback(async (action) => {
    setError('');
    try {
      return await action();
    } catch (err) {
      setError(err.message);
      return undefined;
    }
  }, []);

  const refresh = useCallback(
    async (term) => {
      const data = await run(() => listItems(term));
      if (data) setItems(data);
    },
    [run]
  );

  useEffect(() => {
    health()
      .then(() => setStatus('up'))
      .catch(() => setStatus('down'));
    refresh('');
  }, [refresh]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = await run(() => login(credentials.username, credentials.password));
    if (data) setSession(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const created = await run(() => addItem(session.token, newItem));
    if (created) {
      setNewItem({ name: '', description: '' });
      refresh(search);
    }
  };

  const handleDelete = async (id) => {
    await run(() => deleteItem(session.token, id));
    refresh(search);
  };

  return (
    <main className="container">
      <header>
        <h1>HU Inventory</h1>
        <span className={`badge ${status}`}>Backend: {status}</span>
      </header>

      {error && <p className="error">{error}</p>}

      {session ? (
        <p>
          Signed in as <strong>{session.user.username}</strong> ({session.user.role}){' '}
          <button onClick={() => setSession(null)}>Logout</button>
        </p>
      ) : (
        <form onSubmit={handleLogin} className="row">
          <input
            placeholder="Username"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <button type="submit">Login</button>
        </form>
      )}

      <section>
        <h2>Items</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            refresh(search);
          }}
        >
          <input placeholder="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit">Search</button>
        </form>

        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.name}</strong> - {item.description}
              </span>
              {session && <button onClick={() => handleDelete(item.id)}>Delete</button>}
            </li>
          ))}
        </ul>

        {session && (
          <form onSubmit={handleAdd} className="row">
            <input
              required
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <button type="submit">Add item</button>
          </form>
        )}
      </section>
    </main>
  );
}
