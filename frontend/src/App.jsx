import React, { useState, useEffect } from 'react';

// Define the base URL for your Strapi API
const STRAPI_URL = 'http://localhost:1337/api';

// A simple helper function to generate a random code
const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


// A simple component to display messages to the user
const MessageBox = ({ message, type }) => {
  if (!message) return null;
  const messageStyle = {
    padding: '1rem',
    margin: '1rem 0',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: type === 'error' ? '#d9534f' : '#5cb85c',
    whiteSpace: 'pre-wrap', // Ensures error messages with newlines are formatted correctly
  };
  return <div style={messageStyle}>{message}</div>;
};

function App() {
  // State to toggle between Login and Register modes
  const [isLoginMode, setIsLoginMode] = useState(true);

  // State for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State for handling messages and errors
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // State to track if the user is logged in
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(null);
  
  // State for relationship data
  const [relationship, setRelationship] = useState(null);
  const [relationshipCode, setRelationshipCode] = useState('');


  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${STRAPI_URL}/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errorMessages = data.error.details.errors ? 
            data.error.details.errors.map(e => e.message).join('\n') : 
            data.error.message;
        throw new Error(errorMessages);
      }

      setJwt(data.jwt);
      setUser(data.user);
      setMessage('Registration successful! You are now logged in.');

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${STRAPI_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          password,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }
      
      setJwt(data.jwt);
      setUser(data.user);
      setMessage('Login successful!');

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    setJwt(null);
    setRelationship(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setMessage('You have been successfully logged out.');
  };
  
  const handleCreateOrJoinRelationship = async () => {
    setError('');
    setMessage('');

    // Logic to join an existing relationship
    if (relationshipCode) {
      try {
        // Find the relationship by the code provided
        const findResponse = await fetch(`${STRAPI_URL}/relationships?filters[code][$eq]=${relationshipCode}&populate=users`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const findData = await findResponse.json();

        if (!findData.data || findData.data.length === 0) {
          throw new Error('No relationship found with that code.');
        }

        const rel = findData.data[0];
        if (rel.attributes.users.data.length >= 2) {
          throw new Error('This relationship is already full.');
        }
        
        const existingUserId = rel.attributes.users.data[0].id;

        // Add the current user to the found relationship
        const updateResponse = await fetch(`${STRAPI_URL}/relationships/${rel.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            data: {
              users: [existingUserId, user.id],
            },
          }),
        });
        
        const updateData = await updateResponse.json();
        if (updateData.error) throw new Error(updateData.error.message);

        setRelationship(updateData.data);
        setMessage('Successfully joined your partner!');

      } catch(err) {
        setError(err.message || 'Could not join relationship.');
      }
    } 
    // Logic to create a new relationship
    else {
      try {
        const newCode = generateCode();
        const response = await fetch(`${STRAPI_URL}/relationships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            data: {
              code: newCode,
              users: [user.id],
            },
          }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        setRelationship(data.data);
        setMessage(`Relationship created! Your code is: ${newCode}`);

      } catch (err) {
        setError(err.message || 'Could not create relationship.');
      }
    }
  };

  // If user is logged in and paired, show the main app screen
  if (user && relationship) {
    return (
       <div className="container">
        <h1>You are Connected!</h1>
        <MessageBox message={message} type="success" />
        <MessageBox message={error} type="error" />
        <div className="form-container">
            <h2>Relationship Code: {relationship.attributes.code}</h2>
            <p>You are paired with your partner.</p>
            {/* Future app features will go here */}
        </div>
        <button className="toggle-button" onClick={handleLogout}>Logout</button>
      </div>
    )
  }

  // If user is logged in but not paired, show the relationship screen
  if (user) {
    return (
      <div className="container">
        <h1>Welcome, {user.username}!</h1>
        <MessageBox message={message} type="success" />
        <MessageBox message={error} type="error" />

        <div className="form-container">
            <h2>Pair with your Partner</h2>
            <p>Enter your partner's code to join their relationship, or leave it blank to create a new one and get your own code.</p>
             <input
              type="text"
              placeholder="Enter partner's code (optional)"
              value={relationshipCode}
              onChange={(e) => setRelationshipCode(e.target.value.toUpperCase())}
            />
            <button onClick={handleCreateOrJoinRelationship}>Connect</button>
        </div>
        <button className="toggle-button" onClick={handleLogout}>Logout</button>
      </div>
    );
  }


  // If no user is logged in, show the Login/Register form
  return (
    <div className="container">
      <div className="form-container">
        <h1>Couples Connection</h1>
        <h2>{isLoginMode ? 'Login' : 'Register'}</h2>

        <MessageBox message={message} type="success" />
        <MessageBox message={error} type="error" />

        <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
          {!isLoginMode && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLoginMode ? 'Login' : 'Register'}</button>
        </form>

        <button className="toggle-button" onClick={() => setIsLoginMode(!isLoginMode)}>
          {isLoginMode ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );
}

export default App;
