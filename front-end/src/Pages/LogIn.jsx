import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
    <main className="w-full min-h-screen flex justify-center items-center p-4 bg-gradient-to-r from-[#fffaf5] via-[#e7fdfd] to-[#aeeaf5] bg-cover bg-center">
      <section className="w-full max-w-3xl bg-white/50 backdrop-blur-md border-green-500/30 border rounded-lg justify-center items-center space-x-5 flex flex-col">
        <section className="flex items-center py-5 space-x-5 justify-start w-full px-5">
          <img
            className="w-[50px] rounded-full"
            src="./depEdCNLogo.png" alt="depedLogo" />
          <h1 className="text-xl font-semibold">Database of Travel Authority</h1>
        </section>
        <div className="flex justify-center items-center gap-5 p-5 flex-wrap md:flex-nowrap">
          <section className="p-8 border-green-500/30 border rounded-xl shadow-lg max-w-sm w-full bg-white/80">
            <header>
              <Typography variant="h5" className="mb-5 text-center font-bold" sx={{ mb: 3, textAlign: 'center', fontWeight: 700 }}>
                Admin Log in
              </Typography>
            </header>
            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                autoFocus
                required
                id="password"
                label="Admin Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter the admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{ backgroundColor: '#1e293b', '&:hover': { backgroundColor: '#334155' } }}
              >
                {submitting ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </section>
          <section className="hidden md:block">
            <img className="w-[500px] max-w-full" src="./authen.png" alt="image" />
          </section>
        </div>
      </section>
    </main>
  );
};

export default LogIn;
