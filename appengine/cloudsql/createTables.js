/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Require process, so we can mock environment variables
const process = require('process');

// [START createTables]
// [START setup]
const Knex = require('knex');
const prompt = require('prompt');
// [END setup]

// [START createTable]
/**
 * Create the "visits" table.
 *
 * @param {object} knex A Knex client object.
 */
function createTable (knex) {
  return knex.schema.createTable('visits', (table) => {
    table.increments();
    table.timestamp('timestamp');
    table.string('userIp');
  })
  .then(() => {
    console.log(`Successfully created 'visits' table.`);
    return knex;
  })
  .catch((err) => {
    console.error(`Failed to create 'visits' table:`, err);
    return knex;
  });
}
// [END createTable]

// [START postgresGetConnection]
/**
 * Ask the user for connection configuration and create a new connection.
 */
function postgresGetConnection () {
  const FIELDS = ['user', 'password', 'database'];
  return new Promise((resolve, reject) => {
    prompt.start();
    prompt.get(FIELDS, (err, config) => {
      if (err) {
        reject(err);
      }

      // Connect to the database
      resolve(Knex({
        client: 'pg',
        connection: config
      }));
    });
  });
}
// [END postgresGetConnection]

// [START mysqlGetConnection]
/**
 * Ask the user for connection configuration and create a new connection.
 */
function mysqlGetConnection () {
  const FIELDS = ['user', 'password', 'database'];
  return new Promise((resolve, reject) => {
    prompt.start();
    prompt.get(FIELDS, (err, config) => {
      if (err) {
        return reject(err);
      }

      // Connect to the database
      return resolve(Knex({
        client: 'mysql',
        connection: config
      }));
    });
  });
}
// [END mysqlGetConnection]

exports.postgresMain = function () {
  // [START postgresMain]
  postgresGetConnection()
    .then((knex) => {
      return createTable(knex);
    })
    .then((knex) => {
      return knex.destroy();
    })
    .catch((err, knex) => {
      console.error(`Failed to create database connection:`, err);
      return knex.destroy();
    });
  // [END postgresMain]
};

exports.mysqlMain = function () {
  // [START mysqlMain]
  mysqlGetConnection()
    .then((knex) => {
      return createTable(knex);
    })
    .then((knex) => {
      return knex.destroy();
    })
    .catch((err, knex) => {
      console.error(`Failed to create database connection:`, err);
      if (knex) {
        knex.destroy();
      }
    });
  // [END mysqlMain]
};
// [END createTables]

// Get type of SQL client to use
const sqlClient = process.env.SQL_CLIENT;
if (sqlClient === 'pg') {
  exports.postgresMain();
} else if (sqlClient === 'mysql') {
  exports.mysqlMain();
} else {
  throw new Error(`The SQL_CLIENT environment variable must be set to 'pg' or 'mysql'.`);
}
