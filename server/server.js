const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const saltRounds = 10;
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require("googleapis");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const port = 5000;
const domain = "http://localhost:" + port;
const email_user = process.env.EMAIL_USER;

const clien_domain = "http://localhost:5173";

const oAuth2Client = new google.auth.OAuth2(
  process.env.EMAIL_CLIENT_ID,
  process.env.EMAIL_CLIENT_SECRET,
  clien_domain + "/auth/google/callback"
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const fs = require("fs");
const dir = "./public/uploads";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const deleteFile = (filename) => {
  fs.unlink(filename, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT * FROM users WHERE google_id = ?",
            [profile.id],
            (error, results) => {
              if (error) return reject(error);
              resolve(results[0]);
            }
          );
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = {
          google_id: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
          profile_picture: profile.photos[0].value,
        };

        connection.query(
          "INSERT INTO users (google_id, username, email, profile_picture, is_verified) VALUES (?, ?, ?, ?, ?)",
          [
            newUser.google_id,
            newUser.username,
            newUser.email,
            newUser.profile_picture,
            true,
          ],
          (error, results) => {
            if (error) return done(error);
            newUser.id = results.insertId;
            done(null, newUser);
          }
        );
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "plutocinema",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting: " + err.stack);
    return;
  }
  console.log("Connected as id " + connection.threadId);
});
const accessToken = oAuth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.EMAIL_CLIENT_ID,
    clientSecret: process.env.EMAIL_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken.token,
  },
});

const sendConfirmationEmail = (to, token) => {
  const url = `${domain}/confirm-email?token=${token}`;
  const mailOptions = {
    from: email_user,
    to,
    subject: "Konfirmasi Email",
    text: `Silakan klik link berikut untuk mengonfirmasi email Anda: ${url}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

// ! ===============================================  Auth ===============================================
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    username,
    email,
    password: hashedPassword,
  };

  connection.query("INSERT INTO users SET ?", newUser, (error, results) => {
    if (error)
      return res.status(500).json({ message: "Error registering user" });

    const token = jwt.sign({ id: results.insertId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const confirmUrl = `${domain}/confirm-email?token=${token}`;

    transporter.sendMail({
      to: email,
      subject: "Confirm Your Email",
      html: `<a href="${confirmUrl}">Confirm your email</a>`,
    });

    res.json({
      message: "Registration successful. Please check your email to confirm.",
    });
  });
});

app.get("/confirm-email", async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    connection.query(
      "UPDATE users SET is_verified = ? WHERE id = ?",
      [true, decoded.id],
      (error) => {
        if (error)
          return res.status(500).json({ message: "Error confirming email" });

        const redirectUrl = `${clien_domain}/email-confirmed`;
        res.redirect(redirectUrl);
      }
    );
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ? or username = ?",
    [email, email],
    async (error, results) => {
      if (error) return res.status(500).json({ message: "Error logging in" });
      if (results.length === 0)
        return res.status(401).json({ message: "User not found" });

      const user = results[0];
      if (!user.is_verified)
        return res.status(401).json({ message: "Email not verified" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (error, results) => {
      if (error)
        return res.status(500).json({ message: "Error fetching user" });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });

      const user = results[0];
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      const resetUrl = `${domain}/reset-password?token=${token}`;

      transporter.sendMail({
        to: email,
        subject: "Reset Your Password",
        html: `<a href="${resetUrl}">Reset your password</a>`,
      });

      res.json({ message: "Password reset link sent to your email." });
    }
  );
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    connection.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, decoded.id],
      (error) => {
        if (error)
          return res.status(500).json({ message: "Error updating password" });
        res.json({ message: "Password updated successfully" });
      }
    );
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

// ! ===============================================  Auth ===============================================
// ! ===============================================  Auth Google ===============================================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.redirect(`${clien_domain}/home?token=${token}`);
  }
);

// ! ===============================================  Auth Google ===============================================

app.get("/api/all-movies", (req, res) => {
  // Get limit and offset from query parameters (default: limit = 10, offset = 0)
  const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 movies per page
  const offset = parseInt(req.query.offset, 10) || 0; // Default to start from the first record

  // SQL query to fetch movies with pagination
  const query = `
    SELECT m.id, m.poster, m.title 
    FROM movies m 
    WHERE m.status = "accepted"
    LIMIT ? OFFSET ?
  `;

  // Execute the query with limit and offset values
  connection.query(query, [limit, offset], (err, results) => {
    if (err) {
      return res.status(500).send(err); // Handle the error
    }

    // Also fetch the total number of accepted movies for pagination calculation
    const countQuery = `SELECT COUNT(*) as total FROM movies WHERE status = "accepted"`;

    connection.query(countQuery, (err, countResult) => {
      if (err) {
        return res.status(500).send(err);
      }

      const totalMovies = countResult[0].total;

      // Send both the movies and the total number of movies
      res.json({
        movies: results, // List of movies for the current page
        total: totalMovies, // Total number of accepted movies
      });
    });
  });
});

app.get("/api/get-movies-poster/:limit", (req, res) => {
  const limit = req.params.limit;
  const query = `SELECT movies.poster FROM movies ORDER BY created_at DESC LIMIT ${limit}`;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).send(err);

    res.json(results);
  });
});

app.get("/api/movies/comments/:id", (req, res) => {
  const movieId = req.params.id;
  const limit = parseInt(req.query.limit) || 3;
  const offset = parseInt(req.query.offset) || 0;

  // const countQuery = `SELECT COUNT(*) as total FROM comments WHERE movie_id = ? and status = 'accepted'`;
  // join users and user.deleted_at is null
  const countQuery = `
  SELECT COUNT(*) as total
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id AND u.deleted_at IS NULL
  WHERE c.movie_id = ? and c.status = 'accepted' and c.deleted_at IS NULL
  `;

  const dataQuery = `
  SELECT c.*, u.username, u.profile_picture
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id AND u.deleted_at IS NULL
  WHERE c.movie_id = ? and c.status = 'accepted' and c.deleted_at IS NULL
  LIMIT ? OFFSET ?
  `;

  connection.query(countQuery, [movieId], (err, countResult) => {
    if (err) return res.status(500).send(err);

    const totalComments = countResult[0].total;

    connection.query(
      dataQuery,
      [movieId, limit, offset],
      (err, dataResults) => {
        if (err) return res.status(500).send(err);

        res.json({ comments: dataResults, total: totalComments });
      }
    );
  });
});

app.post("/api/movies/comments/:movieId", (req, res) => {
  const { userId, rate, comments } = req.body;
  const movieId = req.params.movieId;

  const query =
    "INSERT INTO comments (movie_id, user_id, rate, comments, comment_date) VALUES (?, ?, ?, ?, NOW())";
  connection.query(
    query,
    [movieId, userId, rate, comments],
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({
        comment: {
          id: result.insertId,
          userId: userId,
          rate: rate,
          comments: comments,
          comment_date: new Date(),
        },
      });
    }
  );
});

app.post("/api/movies/update-view-count/:id", (req, res) => {
  const movieId = req.params.id;

  const query = `
  UPDATE movies
  SET views = views + 1
  WHERE id = ? and status = 'accepted' and deleted_at IS NULL
`;

  connection.query(query, [movieId], (err, results) => {
    if (err) return res.status(500).send(err);

    res.json({ message: "Success" });
  });
});

app.get("/api/movies-search", (req, res) => {
  const search = req.query.search || ""; // Get search term from query
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  // SQL query to search movies and join with genres
  const query = `
    SELECT m.id, m.poster, m.title, m.year, m.synopsis, m.availability, m.views, m.trailer, m.status,
           GROUP_CONCAT(g.name ORDER BY g.name ASC) AS genres
    FROM movies m
    LEFT JOIN movies_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE m.status = "accepted" AND m.title LIKE ?
    GROUP BY m.id
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [`%${search}%`, limit, offset], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }

    // Count total movies that match the search
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM movies 
      WHERE status = "accepted" AND title LIKE ?
    `;

    connection.query(countQuery, [`%${search}%`], (err, countResult) => {
      if (err) {
        return res.status(500).send(err);
      }

      const totalMovies = countResult[0].total;

      // Send the search results and total count
      res.json({
        movies: results, // Movies matching the search
        total: totalMovies, // Total count of movies matching the search
      });
    });
  });
});

app.get("/api/movie-details/:id", (req, res) => {
  const movieId = req.params.id;

  //   const movieQuery = `
  // SELECT m.*, c.name AS country_name, AVG(cm.rate) AS rating
  // FROM movies m
  // JOIN countries c ON m.countries_id = c.id
  // LEFT JOIN comments cm ON m.id = cm.movie_id
  // WHERE m.id = ?
  // `;

  // fix movieQuery, its not working if there is no comment
  const movieQuery = `
SELECT m.*, c.name AS country_name, IFNULL(AVG(cm.rate), 0) AS rating
FROM movies m
JOIN countries c ON m.countries_id = c.id
LEFT JOIN comments cm ON m.id = cm.movie_id
WHERE m.id = ? and m.status = 'accepted' and m.deleted_at IS NULL and c.deleted_at IS NULL 
GROUP BY m.id
`;

  const genresQuery = `
  SELECT g.*
  FROM genres g
  JOIN movies_genres mg ON g.id = mg.genre_id
  JOIN movies m ON mg.movie_id = m.id
  WHERE mg.movie_id = ? AND m.status = 'accepted' AND m.deleted_at IS NULL AND g.deleted_at IS NULL
`;

  const actorsQuery = `
  SELECT a.*
  FROM actors a
  JOIN movies_actors ma ON a.id = ma.actor_id
  JOIN movies m ON ma.movie_id = m.id
  WHERE ma.movie_id = ? AND m.status = 'accepted' AND m.deleted_at IS NULL AND a.deleted_at IS NULL
`;

  connection.query(movieQuery, [movieId], (err, movieResults) => {
    if (err) return res.status(500).send(err);

    const movie = movieResults[0];

    connection.query(genresQuery, [movieId], (err, genresResults) => {
      if (err) return res.status(500).send(err);

      connection.query(actorsQuery, [movieId], (err, actorsResults) => {
        if (err) return res.status(500).send(err);

        res.json({
          ...movie,
          genres: genresResults,
          actors: actorsResults,
        });
      });
    });
  });
});

// ! ===============================================  CMS ===============================================

app.get("/api/cms/comments", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search}%` : "%%";
  const orderColumnIndex = parseInt(req.query.order) || 0;
  const orderDir = req.query.dir === "desc" ? "DESC" : "ASC";

  const orderColumns = [
    "c.id", // 0
    "u.username", // 1
    "c.rate", // 2
    "m.title", // 3
    "c.comments", // 4
    "c.status", // 5
  ];

  const orderColumn = orderColumns[orderColumnIndex] || "c.comment_date";

  console.log(search, orderColumn, orderDir);

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id AND u.deleted_at IS NULL
    JOIN movies m ON c.movie_id = m.id
    WHERE (u.username LIKE ? OR c.rate LIKE ? OR m.title LIKE ? OR c.comments LIKE ? or c.status LIKE ?) AND c.deleted_at IS NULL AND m.deleted_at IS NULL
  `;

  const dataQuery = `
  SELECT c.*, u.username, m.title
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id AND u.deleted_at IS NULL
  JOIN movies m ON c.movie_id = m.id
  WHERE (u.username LIKE ? OR c.rate LIKE ? OR m.title LIKE ? OR c.comments LIKE ? or c.status LIKE ?) AND c.deleted_at IS NULL AND m.deleted_at IS NULL
  ORDER BY 
  ${orderColumn} ${orderDir},
      CASE 
          WHEN c.status = 'pending' THEN 1 
          ELSE 2 
      END
  LIMIT ? OFFSET ?
`;

  connection.query(
    countQuery,
    [search, search, search, search, search],
    (err, countResult) => {
      if (err) return res.status(500).send(err);

      const totalComments = countResult[0].total;

      connection.query(
        dataQuery,
        [search, search, search, search, search, limit, offset],
        (err, dataResults) => {
          if (err) return res.status(500).send(err);

          res.json({
            comments: dataResults,
            recordsTotal: totalComments,
            recordsFiltered: totalComments,
          });
        }
      );
    }
  );
});

app.post("/api/cms/comments/action", (req, res) => {
  const { ids, action } = req.body;

  const query = `UPDATE comments SET status = ? WHERE id IN (${ids.join(
    ","
  )}) AND deleted_at IS NULL`;

  connection.query(query, [action], (err, results) => {
    if (err) return res.status(500).send(err);

    res.json({ success: true });
  });
});

app.get("/api/cms/users", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search}%` : "%%";
  const orderColumnIndex = parseInt(req.query.order) || 0;
  const orderDir = req.query.dir === "desc" ? "DESC" : "ASC";

  const orderColumns = [
    "id", // 0
    "username", // 1
    "email", // 2
    "role", // 3
  ];

  const orderColumn = orderColumns[orderColumnIndex] || "id";

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM users
    WHERE (username LIKE ? OR email LIKE ?) AND deleted_at IS NULL
  `;

  const dataQuery = `
  SELECT *
  FROM users
  WHERE (username LIKE ? OR email LIKE ?) AND deleted_at IS NULL
  ORDER BY ${orderColumn} ${orderDir}
  LIMIT ? OFFSET ?
`;

  connection.query(countQuery, [search, search], (err, countResult) => {
    if (err) return res.status(500).send(err);

    const totalUsers = countResult[0].total;

    connection.query(
      dataQuery,
      [search, search, limit, offset],
      (err, dataResults) => {
        if (err) return res.status(500).send(err);

        res.json({
          users: dataResults,
          recordsTotal: totalUsers,
          recordsFiltered: totalUsers,
        });
      }
    );
  });
});

app.delete("/api/cms/users/:id", (req, res) => {
  const userId = req.params.id;

  const query = `UPDATE users SET deleted_at = NOW() WHERE id = ?`;

  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send(err);

    res.json({ success: true });
  });
});

app.post("/api/cms/users", (req, res) => {
  const { username, email, role } = req.body;

  const default_password = bcrypt.hashSync("12345", saltRounds);

  const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;

  connection.query(
    query,
    [username, email, default_password, role],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Database error: Failed to create user" });

      res.json({ success: true });
    }
  );
});

app.put("/api/cms/users/:id", (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  const query = `UPDATE users SET username = ?, email = ? WHERE id = ?`;

  connection.query(query, [username, email, userId], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Database error: Failed to update user" });

    res.json({ success: true });
  });
});
app.put("/api/cms/users/role/:id", (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const query = `UPDATE users SET role = ? WHERE id = ?`;

  connection.query(query, [role, userId], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Database error: Failed to update user" });

    res.json({ success: true });
  });
});

app.get("/api/cms/countrylist", (req, res) => {
  const query = `SELECT id, name FROM countries`;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).send(err);

    res.json(results);
  });
});

app.get("/api/cms/genrelist", (req, res) => {
  const query = `SELECT id, name FROM genres`;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).send(err);

    res.json(results);
  });
});

app.get("/api/cms/awardlist", (req, res) => {
  const query = `SELECT id, name FROM awards`;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).send(err);

    res.json(results);
  });
});

app.get("/api/cms/actors", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search}%` : "%%";
  const orderColumnIndex = parseInt(req.query.order) || 0;
  const orderDir = req.query.dir === "desc" ? "DESC" : "ASC";

  const orderColumns = [
    "a.id", // 0
    "c.name", // 1
    "a.name", // 2
    "a.birthdate", // 3
    "a.picture_profile", // 4
  ];

  const orderColumn = orderColumns[orderColumnIndex] || "a.id";

  const countQuery = `
    SELECT COUNT(*) as total
    FROM actors
    WHERE (name LIKE ? OR birthdate LIKE ?) AND deleted_at IS NULL
  `;
  const dataQuery = `
  SELECT a.*, c.name AS country_name
  FROM actors a
  JOIN countries c ON a.countries_id = c.id
  WHERE (a.name LIKE ? OR a.birthdate LIKE ?) AND a.deleted_at IS NULL
  ORDER BY ${orderColumn} ${orderDir}
  LIMIT ? OFFSET ?
`;

  connection.query(countQuery, [search, search], (err, countResult) => {
    if (err) return res.status(500).send(err);

    const totalActors = countResult[0].total;

    connection.query(
      dataQuery,
      [search, search, limit, offset],
      (err, dataResults) => {
        if (err) return res.status(500).send(err);

        res.json({
          actors: dataResults,
          recordsTotal: totalActors,
          recordsFiltered: totalActors,
        });
      }
    );
  });
});

app.post("/api/cms/actors", upload.single("file"), async (req, res) => {
  try {
    const { filename } = req.file;
    var { country, actorName, birthDate } = req.body;
    country = country.toUpperCase();
    let country_id = 0;

    const countryQuery = `SELECT id FROM countries WHERE UPPER(name) = ?`;

    const queryDatabase = (query, params) => {
      return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });
    };

    const results = await queryDatabase(countryQuery, [country]);

    if (results.length === 0) {
      const countryName = country.charAt(0) + country.slice(1).toLowerCase();
      const insertCountryQuery = `INSERT INTO countries (name) VALUES (?)`;

      const insertResults = await queryDatabase(insertCountryQuery, [
        countryName,
      ]);
      country_id = insertResults.insertId;
    } else {
      country_id = results[0].id;
    }

    const query = `INSERT INTO actors (countries_id, name, picture_profile, birthdate) VALUES (?, ?, ?, ?)`;

    connection.query(
      query,
      [country_id, actorName, `/public/uploads/${filename}`, birthDate],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Error inserting actor" });
        }

        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error uploading file" });
  }
});

app.put("/api/cms/actors/:id", upload.single("img"), async (req, res) => {
  const actorId = req.params.id;
  var { country, name, date } = req.body;
  const filename = req.file ? req.file.filename : null;
  country = country.toUpperCase();
  let country_id = 0;

  const countryQuery = `SELECT id FROM countries WHERE UPPER(name) = ?`;

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  };

  const results = await queryDatabase(countryQuery, [country]);

  if (results.length === 0) {
    const countryName = country.charAt(0) + country.slice(1).toLowerCase();
    const insertCountryQuery = `INSERT INTO countries (name) VALUES (?)`;

    const insertResults = await queryDatabase(insertCountryQuery, [
      countryName,
    ]);
    country_id = insertResults.insertId;
  } else {
    country_id = results[0].id;
  }

  const actorQuery = `SELECT picture_profile FROM actors WHERE id = ?`;

  const actorResults = await queryDatabase(actorQuery, [actorId]);

  if (actorResults.length === 0) {
    return res.status(404).json({ message: "Actor not found" });
  }

  const oldPicture = actorResults[0].picture_profile;

  const query = `UPDATE actors SET countries_id = ?, name = ?, picture_profile = ?, birthdate = ? WHERE id = ?`;

  connection.query(
    query,
    [
      country_id,
      name,
      filename ? `/public/uploads/${filename}` : oldPicture,
      date,
      actorId,
    ],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error updating actor" });
      }

      if (filename && oldPicture.includes("/public/uploads/")) {
        const oldPicturePath = oldPicture.replace("/public", "");

        deleteFile(`public${oldPicturePath}`);
      }

      res.json({ success: true });
    }
  );
});

app.delete("/api/cms/actors/:id", (req, res) => {
  const actorId = req.params.id;

  const query = `UPDATE actors SET deleted_at = NOW() WHERE id = ?`;

  connection.query(query, [actorId], (err, results) => {
    if (err) return res.status(500).send(err);

    res.json({ success: true });
  });
});

app.post("/api/cms/movies", upload.single("poster"), async (req, res) => {
  try {
    const { filename } = req.file;
    var {
      title,
      alternative_title,
      year,
      country,
      synopsis,
      availability,
      genres,
      link_trailer,
      award,
      actors,
    } = req.body;

    if (typeof genres === "string") {
      genres = [genres];
    }
    if (typeof award === "string") {
      award = [award];
    }

    // ----------------- COUNTRY -----------------

    country = country.toUpperCase();
    let country_id = 0;

    const countryQuery = `SELECT id FROM countries WHERE UPPER(name) = ?`;

    const queryDatabase = (query, params) => {
      return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });
    };

    const results = await queryDatabase(countryQuery, [country]);

    if (results.length === 0) {
      const countryName = country.charAt(0) + country.slice(1).toLowerCase();
      const insertCountryQuery = `INSERT INTO countries (name) VALUES (?)`;

      const insertResults = await queryDatabase(insertCountryQuery, [
        countryName,
      ]);
      country_id = insertResults.insertId;
    } else {
      country_id = results[0].id;
    }
    // ----------------- COUNTRY -----------------

    // ----------------- GENRES -----------------
    var genres_id = [];
    for (let i = 0; i < genres.length; i++) {
      if (isNaN(parseInt(genres[i]))) {
        const genreName =
          genres[i].charAt(0) + genres[i].slice(1).toLowerCase();
        const insertGenreQuery = `INSERT INTO genres (name) VALUES (?)`;

        const insertResults = await queryDatabase(insertGenreQuery, [
          genreName,
        ]);
        genres_id.push(insertResults.insertId);
      } else {
        genres_id.push(parseInt(genres[i]));
      }
    }
    // ----------------- GENRES -----------------

    // ----------------- AWARD -----------------
    var award_id = [];
    for (let i = 0; i < award.length; i++) {
      if (isNaN(parseInt(award[i]))) {
        const awardName = award[i].charAt(0) + award[i].slice(1).toLowerCase();
        const insertAwardQuery = `INSERT INTO awards (name) VALUES (?)`;

        const insertResults = await queryDatabase(insertAwardQuery, [
          awardName,
        ]);
        award_id.push(insertResults.insertId);
      } else {
        award_id.push(parseInt(award[i]));
      }
    }
    // ----------------- AWARD -----------------

    const query = `INSERT INTO movies (countries_id, poster, title, alternative_titles, year, synopsis, availability, trailer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(
      query,
      [
        country_id,
        `/public/uploads/${filename}`,
        title,
        alternative_title,
        year,
        synopsis,
        availability,
        link_trailer,
      ],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Error inserting movie" });
        }

        const movieId = results.insertId;

        const genresQuery = `INSERT INTO movies_genres (movie_id, genre_id) VALUES ?`;
        const genresValues = genres_id.map((genreId) => [movieId, genreId]);

        connection.query(genresQuery, [genresValues], (err, results) => {
          if (err) {
            return res.status(500).json({ message: "Error inserting genres" });
          }
        });

        const awardQuery = `INSERT INTO movies_awards (movie_id, award_id) VALUES ?`;
        const awardValues = award_id.map((awardId) => [movieId, awardId]);

        connection.query(awardQuery, [awardValues], (err, results) => {
          if (err) {
            return res.status(500).json({ message: "Error inserting awards" });
          }
        });

        const actorsQuery = `INSERT INTO movies_actors (movie_id, actor_id) VALUES ?`;
        const actorsValues = actors.map((actorId) => [movieId, actorId]);

        connection.query(actorsQuery, [actorsValues], (err, results) => {
          if (err) {
            return res.status(500).json({ message: "Error inserting actors" });
          }
        });

        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error uploading file" });
  }
});

// ! ===============================================  CMS ===============================================

app.listen(port, () => {
  console.log("Server is running on " + domain);
});