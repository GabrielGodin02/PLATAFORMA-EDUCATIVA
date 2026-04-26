import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HashGenerator from './components/HashGenerator';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <HashGenerator />
            </AuthProvider>
        </Router>
    );
};

export default App;