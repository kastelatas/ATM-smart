require('dotenv').config();
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
})

const getTodaysAppointments = (request, response, user_id, prm_client_id, scope) => {
    let statement = "SELECT concat(enquiries.name, ' ', enquiries.last_name) AS patient_name, doctor_name, " +
        "appointments.time AS time, enquiries.phone AS patient_phone FROM appointments "
    statement += "LEFT JOIN enquiries ON appointments.enquiry_id = enquiries.id "
    statement += "LEFT JOIN users ON enquiries.prm_dentist_user_id = users.id "
    statement += "WHERE date = CURRENT_DATE "
    statement += "AND appointments.appointment_canceled_in_advance_by_patient = FALSE "
    statement += "AND appointments.appointment_canceled_in_advance_by_clinic = FALSE "
    if (scope == 'All') {
    } else if (scope == 'PrmClient') {
        statement += "AND users.prm_client_id = " + prm_client_id
    } else if (scope == 'Self') {
        statement += "AND enquiries.prm_dentist_user_id = " + user_id + " OR enquiries.prm_surgeon_user_id = " + user_id
    }
    statement += "ORDER BY time ASC"
    pool.query(statement, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getStaff = (request, response, prm_client_id, scope) => {
    let statement = "SELECT id, concat(title, ' ', first_name, ' ', surname) AS name, specialization FROM users "
    statement += "WHERE active = true "
    statement += "AND prm_role_id IN (1, 3, 6, 7, 8, 9, 10) "
    if (scope == 'All') {
    } else if (scope == 'PrmClient') {
        statement += "AND prm_client_id = " + prm_client_id
    }
    statement += "ORDER BY last_sign_in_at DESC "
    pool.query(statement, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getAssignmentsForUser = (request, response, user_id) => {
    let statement = "SELECT description, concat(enquiries.name, ' ', enquiries.last_name) AS patient_name, due_at FROM todos " 
    statement += "LEFT JOIN enquiries ON todos.enquiry_id = enquiries.id "
    statement += "LEFT JOIN users ON todos.user_id = users.id "
    statement += "WHERE todos.completed = false "
    statement += "AND users.id = " + user_id
    statement += "ORDER BY due_at ASC "
    pool.query(statement, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

module.exports = {
    getTodaysAppointments,
    getStaff,
    getAssignmentsForUser
}