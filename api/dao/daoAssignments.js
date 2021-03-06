require('dotenv').config();
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
})

const getAssignments = (request, response, scope, userid, accessible_user_ids, prmClientId, due) =>  {
    var condition = null;
    if (due == "today") {
        condition = "WHERE (todos.due_at = now()::date) AND completed = false"
    } else if (due == "future") {
        condition = "WHERE (todos.due_at > now()::date) AND completed = false"
    } else if (due == "past") {
        condition = "WHERE (todos.due_at < now()::date)  AND completed = false"
    } else if (due == "finished") {
        condition = "WHERE ( (date_trunc('month', todos.updated_at) + INTERVAL '1 MONTH') > now()::date  ) AND completed = true"
    } else if (due == "all") {
      condition = "WHERE completed = false"
    } else {
        response.status(200).json("NOK: Unknown due " + due)
        return
    }
    if (scope == "All") {
        var statement = ["SELECT todos.*, prm_client.id AS prm_client_id, enquiries.name AS patientname, enquiries.prm_dentist_user_id, " +
        "enquiries.last_name AS patientlastname, concat(users.title, ' ', users.first_name, ' ', users.surname) AS todoname, " +
        "dentists.name AS dentist_name, dentists.id as dentists_id, appointments.patient_attended, appointments.appointment_canceled_in_advance_by_clinic, appointments.appointment_canceled_in_advance_by_patient FROM todos",
                         "LEFT JOIN enquiries ON todos.enquiry_id = enquiries.id",
                         "LEFT JOIN users ON todos.user_id = users.id",
                         "LEFT JOIN users dentists ON enquiries.prm_dentist_user_id = users.id",
                         "LEFT JOIN clients ON todos.client_id = clients.id",
                         "LEFT JOIN clients_prm_client_bridge ON clients.id = clients_prm_client_bridge.clients_id",
                         "LEFT JOIN prm_client ON clients_prm_client_bridge.prm_client_id = prm_client.id",                         
                         "LEFT JOIN appointments ON todos.enquiry_id = appointments.enquiry_id",
                         condition,
                         "ORDER BY todos.due_at ASC"].join('\n') 
        pool.query(statement, (error, results) => {
          console.log(error)
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        })
    } else if (scope == "PrmClient") {
        var statement = ["SELECT todos.*, prm_client.id AS prm_client_id, enquiries.name AS patientname, enquiries.prm_dentist_user_id, enquiries.last_name AS patientlastname, concat(users.title, ' ', users.first_name, ' ', users.surname) AS todoname, dentists.name AS dentist_name, dentists.id as dentists_id FROM todos",
                         "LEFT JOIN enquiries ON todos.enquiry_id = enquiries.id",
                         "LEFT JOIN users ON todos.user_id = users.id",
                         "LEFT JOIN users dentists ON enquiries.prm_dentist_user_id = users.id",
                         "LEFT JOIN clients ON todos.client_id = clients.id",
                         "LEFT JOIN clients_prm_client_bridge ON clients.id = clients_prm_client_bridge.clients_id",
                         "LEFT JOIN prm_client ON clients_prm_client_bridge.prm_client_id = prm_client.id",                         
                         condition,
                         "AND prm_client.id=" + prmClientId,
                         "ORDER BY todos.due_at ASC"].join('\n') 
        pool.query(statement, [prmClientId], (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        }) 
    } else if (scope == "Self") {       
        var statement = ["SELECT todos.*, prm_client.id AS prm_client_id, enquiries.name AS patientname, enquiries.last_name AS patientlastname, concat(users.title, ' ', users.first_name, ' ', users.surname) AS todoname, dentists.name AS dentistname FROM todos",
                         "LEFT JOIN enquiries ON todos.enquiry_id = enquiries.id",
                         "LEFT JOIN users ON todos.user_id = users.id",
                         "LEFT JOIN users dentists ON enquiries.prm_dentist_user_id = users.id",
                         "LEFT JOIN clients ON todos.client_id = clients.id",
                         "LEFT JOIN clients_prm_client_bridge ON clients.id = clients_prm_client_bridge.clients_id",
                         "LEFT JOIN prm_client ON clients_prm_client_bridge.prm_client_id = prm_client.id",
                         condition,
                         "AND users.id=" + userid,
                         "ORDER BY todos.due_at ASC"].join('\n') 
        pool.query(statement, [userid], (error, results) => {
          console.log(error)
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        }) 
    } else if (scope == "Self&LinkedUsers") {
        var conditionScope = "AND ("
        conditionScope +=    "users.id=" + userid;
        if (accessible_user_ids) {
            for (const acc_id in accessible_user_ids) {
                conditionScope +=" OR users.id=" + accessible_user_ids[acc_id];
            } 
        }
        conditionScope += ")";
        var statement = ["SELECT todos.*, prm_client.id AS prm_client_id, enquiries.name AS patientname, enquiries.prm_dentist_user_id, enquiries.last_name AS patientlastname, concat(users.title, ' ', users.first_name, ' ', users.surname) AS todoname, dentists.name AS dentist_name, dentists.id as dentists_id FROM todos",
                         "LEFT JOIN enquiries ON todos.enquiry_id = enquiries.id",
                         "LEFT JOIN users ON todos.user_id = users.id",
                         "LEFT JOIN users dentists ON enquiries.prm_dentist_user_id = users.id",
                         "LEFT JOIN clients ON todos.client_id = clients.id",
                         "LEFT JOIN clients_prm_client_bridge ON clients.id = clients_prm_client_bridge.clients_id",
                         "LEFT JOIN prm_client ON clients_prm_client_bridge.prm_client_id = prm_client.id",                         
                         condition,
                         conditionScope,
                         "ORDER BY todos.due_at ASC"].join('\n') 
        console.log(statement)
        pool.query(statement, (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        }) 
    }     
}

const finishAssignment = (req, res, assignmentDescriptor) =>  {
    pool.query("UPDATE todos SET completed=$2, updated_at=now()  WHERE id=$1" , [assignmentDescriptor.id, assignmentDescriptor.finished])
    res.status(200).json("OK")
}

const createAssignment = (req, res, assignment) => {
  let assignmentStatement = "INSERT INTO todos ("
  if (assignment.enquiry) assignmentStatement += "enquiry_id,"
  if (assignment.description) assignmentStatement += "description,"
  if (assignment.due_at) assignmentStatement += "due_at,"
  if (assignment.user_id && !assignment.user) assignmentStatement += "user_id"
  if (assignment.user_id && assignment.user) assignmentStatement += "user_id,"
  if (assignment.user) assignmentStatement += "user_id"
  assignmentStatement += ") VALUES ("
  if (assignment.enquiry) assignmentStatement += "'" + assignment.enquiry.id + "',"
  if (assignment.description) assignmentStatement += "'" + assignment.description + "',"
  if (assignment.due_at) assignmentStatement += "'" + assignment.due_at + "',"
  if (assignment.user_id && !assignment.user) assignmentStatement += "'" + assignment.user_id + "'"
  if (assignment.user_id && assignment.user) assignmentStatement += "'" + assignment.user_id + "',"
  if (assignment.user) assignmentStatement += "'" + assignment.user.code + "'"
  assignmentStatement += ")";
  console.log(assignmentStatement)
  pool.query(assignmentStatement , (error, results) => {
    console.log(error)
    if (error) {
      throw error
    }
    res.status(200).json("OK")
  })
}

const updateAssignment = (req, res, id, assignment) => {
  let assignmentStatement = "UPDATE todos SET "
  if (assignment.enquiry) assignmentStatement += "enquiry_id='" + assignment.enquiry.id + "',"
  if (assignment.description) assignmentStatement += "description='" + assignment.description + "',"
  if (assignment.due_at) assignmentStatement += "due_at='" + assignment.due_at + "',"
  if (assignment.user_id) assignmentStatement += "user_id='" + assignment.user_id + "'"
  assignmentStatement +=" WHERE todos.id=" + id
  console.log(assignmentStatement)

  pool.query(assignmentStatement , (error, results) => {
    console.log(error)
    if (error) {
      throw error
    }
  })


  res.status(200).json(assignment)
}

module.exports = {
  getAssignments,
  finishAssignment,
  createAssignment,
  updateAssignment
}