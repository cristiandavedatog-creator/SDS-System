import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
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
    <main className="w-full min-h-screen flex justify-center items-center p-4 bg-brand-paper">
      <section className="w-full max-w-3xl bg-white/60 backdrop-blur-md border-brand-navy/15 border rounded-2xl shadow-xl justify-center items-center space-x-5 flex flex-col">
        <section className="flex items-center gap-4 py-6 justify-start w-full px-6 sm:px-8">
          <img
            className="w-12 h-12 rounded-full"
            src="./depEdCNLogo.png" alt="depedLogo" />
          <h1 className="text-lg sm:text-xl font-semibold text-brand-navy">Database of Travel Authority</h1>
        </section>
        <div className="flex justify-center items-center gap-6 p-6 sm:p-8 pt-0 flex-wrap md:flex-nowrap">
          <section className="p-8 border-brand-navy/10 border rounded-xl shadow-md max-w-sm w-full bg-white/90">
            <header>
              <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>
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
                      <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
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
                color="primary"
                size="large"
                disabled={submitting}
                startIcon={!submitting && <LoginIcon />}
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
