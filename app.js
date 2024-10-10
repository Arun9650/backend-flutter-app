const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json()); // To handle JSON data

// Create a connection pool 
const pool = mysql.createPool({
  host: 'srv1127.hstgr.io', // Replace with your database host
  user: 'u624506717_tracker', // Replace with your MySQL username
  password: 'EmpTracker@123', // Replace with your MySQL password
  database: 'u624506717_EmpTracker', // Name of your database
  waitForConnections: true,
  connectionLimit: 10, // Max number of connections to create
  queueLimit: 0 // Unlimited queries in the queue
});

// Test the connection pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database!');
  connection.release(); // Release the connection back to the pool
});

// Login API endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log("🚀 ~ app.post ~ password:", password);
  console.log("🚀 ~ app.post ~ username:", username);

  if (!username || !password) {
    console.log("🚀 ~ app.post ~ password:", password)
    console.log("🚀 ~ app.post ~ username:", username)
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Query to check if the user exists and the password matches
  const query = 'SELECT * FROM EmpDetails WHERE empusername = ? AND emppassword = ?';
  pool.query(query, [username, password], (error, results) => {
    if (error) {
      console.log("🚀 ~ pool.query ~ error:", error)
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length > 0) {
      console.log(results);
      // If login is successful, fetch records from EnquiryDetails where empname matches empusername
      const empname = results[0].empname; // Extract the empusername from the result
      const enquiryQuery = 'SELECT * FROM EnquiryDetails WHERE empname = ?';

      pool.query(enquiryQuery, [empname], (error, enquiryResults) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to fetch enquiry details' });
        }


        // Return login success and all matching EnquiryDetails
        console.log("🚀 ~ app.post ~ results:", results)
        console.log("🚀 ~ app.post ~ enquiryResult:", enquiryResults)
        return res.status(200).json({
          message: 'Login successful',
          user: results[0],
          enquiries: enquiryResults, // Send the enquiry details along with the user info
        });
      });
    } else {
      // If no user is found, login fails
      console.log("🚀 ~ app.post ~ results:", results)
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  });
});

// Fetch all enquiries for a specific empid
app.get('/enquiries/:empid', (req, res) => {
  const empid = req.params.empid;
  console.log("🚀 ~ app.get ~ empid:", empid)

  // Query to fetch all enquiries for a specific employee
  const query = 'SELECT * FROM EnquiryDetails WHERE empid = ?';
  pool.query(query, [empid], (error, results) => {
    if (error) {
      console.error('Database query error:', error); // Log the error
      return res.status(500).json({ error: 'Failed to fetch enquiries' });
    }

    // Return the enquiries data as JSON
    return res.status(200).json(results);
  });
});

// PUT request to update enquiry details
// PUT request to update enquiry details
app.put('/enquiries/:id', (req, res) => {
  const enquiryid = req.params.id;
  console.log("🚀 ~ app.put ~ enquiryId:", enquiryid);
  const { empname, custname, custphoneno, custemailid, custaddress, latitude, longitude, DOB, category } = req.body;

  // Validate input
  if (!empname || !custname || !custphoneno || !custemailid || !custaddress || !latitude || !longitude || !DOB, !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const updateQuery = `
    UPDATE EnquiryDetails 
    SET empname = ?, custname = ?, custphoneno = ?, custemailid = ?, custaddress = ?, longitude = ?, latitude = ?, DOB = ?, category = ?
    WHERE enquiryid = ?
  `;

  // Switch the position of enquiryid and DOB in the query parameters
  pool.query(updateQuery, [empname, custname, custphoneno, custemailid, custaddress, longitude, latitude, DOB, enquiryid, category], (error, results) => {
    if (error) {
      console.error('Database update error:', error); // Log the error details
      return res.status(500).json({ error: 'Failed to update enquiry details' });
    }

    if (results.affectedRows === 0) {
      console.log('Enquiry not found');
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    return res.status(200).json({ message: 'Enquiry updated successfully' });
  });
});


// POST request to add a new enquiry
// POST API endpoint to add a new enquiry

// POST API endpoint to add a new enquiry with empid as a URL parameter
app.post('/enquiry/:empid', (req, res) => {
  const { empid } = req.params;
  const { empname, custname, custphoneno, custemailid, custaddress, latitude, longitude, entrytime, DOB, category } = req.body;
  console.log("🚀 ~ app.post ~ DOB:", DOB)

  // Validate input
  if (!empid || !empname || !custname || !custphoneno || !custemailid || !custaddress || !latitude || !longitude || !DOB, !category) {
    
    return res.status(400).json({ error: 'All fields are required, including empid, empname, and DOB' });
  }

  // Insert query to add a new enquiry with empid, empname, and dob
  const insertQuery = `
    INSERT INTO EnquiryDetails (empid, empname, custname, custphoneno, custemailid, custaddress, latitude, longitude,entrytime,  DOB, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(insertQuery, [empid, empname, custname, custphoneno, custemailid, custaddress, latitude, longitude, entrytime, DOB, category], (error, results) => {
    if (error) {
      console.error('Database insertion error:', error); // Log the error details
      return res.status(500).json({ error: 'Failed to add new enquiry' });
    }

    // Return success message if the enquiry was added
    return res.status(201).json({ message: 'Enquiry added successfully', enquiryId: results.insertId });
  });
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
