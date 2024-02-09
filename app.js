const express = require('express');
const app = express();
const path = require('path');
const pool = require('./models/db')
const bodyParser= require("body-parser")
const bcrypt = require('bcryptjs');

const session = require('express-session');

app.use(session({
    secret: 'my session key', // Change this to a random secret key
    resave: false,
    saveUninitialized: true
}));
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    // Render the home page view
    res.render('home');
});
// Login route
app.get('/login', (req, res) => {
    res.render('login', { error: '' });
});

// POST route for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user with provided email exists in the database
        const user = await getUserByEmail(email);

        if (!user || !bcrypt.compareSync(password, user.password)) {
            // If email or password is wrong, render login page with error message
            return res.render('login', { error: 'Email or password is incorrect' });
        }

        // Set userId in session to indicate user is authenticated
        req.session.userId = user.id;

        // Redirect to dashboard upon successful login
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Function to retrieve user by email
function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        pool.query(query, [email], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0]); // Assuming there's only one user with the given email
            }
        });
    });
}
// Render the sign-in page
app.get('/signin', (req, res) => {
    res.render('signin');
});

// POST route for signin
app.post('/signin', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Check if the email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
        return res.render('signin', { error: 'Email is already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    const confirmHashed = await bcrypt.hash(confirmPassword, 10);
    // Insert user data into the database
    const query = 'INSERT INTO users (firstName, lastName, email, password, confirm_password) VALUES (?, ?, ?, ?, ?)';
    const values = [firstName, lastName, email, hashedPassword, confirmHashed];

    pool.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error inserting data:', error);
            return res.status(500).send('Error inserting data');
        }
        console.log('User data inserted successfully');

        // Redirect to the dashboard page upon successful signup
        res.render('dashboard');
    });
});

// Function to check if email exists
function checkEmailExists(email) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
        pool.query(query, [email], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0].count > 0);
            }
        });
    });
}

// Function to check if email exists
function checkEmailExists(email) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
        pool.query(query, [email], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0].count > 0);
            }
        });
    });
}



// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.redirect('/dashboard'); // Redirect to dashboard if unable to destroy session
        } else {
            res.redirect('/login'); // Redirect to signin page after successful logout
        }
    });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/signin'); // Redirect to signin if user is not authenticated
    }
    res.render('dashboard'); // Render dashboard page if user is authenticated
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
