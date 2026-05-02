'use strict';

// Seed the in-memory SQLite admins table.
//
// Eli MUST be id=1 so that any tautology-style SQLi payload (which collapses
// the WHERE to "always true" and returns the first row by primary key) lands
// on Eli — whose name the dashboard banner echoes back. Reordering this seed
// will silently break the intended solve.

function initDb(db) {
  db.serialize(() => {
    db.run(
      'CREATE TABLE admins (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  username TEXT NOT NULL,' +
      '  password TEXT NOT NULL' +
      ')'
    );
    db.run("INSERT INTO admins (username, password) VALUES ('Eli',     'k3lpdr@gger_99')");
    db.run("INSERT INTO admins (username, password) VALUES ('Marisol', 'tide_keeper_42')");
    db.run("INSERT INTO admins (username, password) VALUES ('Bram',    'lighthouse_oil')");
  });
}

module.exports = { initDb };
