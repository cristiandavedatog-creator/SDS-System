import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth/authClient';

const LogIn = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter the admin password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Log in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full h-screen flex justify-center items-center bg-gradient-to-r from-[#fffaf5] via-[#e7fdfd] to-[#aeeaf5] bg-cover bg-center">
      <section className="w-[900px] bg-white/50 backdrop-blur-md border-green-500/30 border rounded-lg justify-center items-center space-x-5 flex flex-col">
        <section className=' flex items-center py-5 space-x-5 justify-start w-full px-5 '>
          <img
          className='w-[50px] rounded-full '
          src="./depEdCNLogo.png" alt="depedLogo" />
          <h1 className='text-xl font-semibold'>Database of Travel Authority</h1>
        </section>
        <div className='flex justify-center items-center space-x-5 p-5'>
        <section className="p-8 border-green-500/30 border h-[75%] rounded-xl shadow-lg max-w-sm w-full bg-white/80">
          <header>
            <h1 className="text-xl font-bold mb-5 text-center">Admin Log in</h1>
          </header>
          <form onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Admin Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter the admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-900 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </section>
        <section className='hidden md:block'>
          <img className="w-[500px]" src="./authen.png" alt="image" />
        </section>
        </div>
      </section>
    </main>
  );
};

export default LogIn;
