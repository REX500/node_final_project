var employees = {};

employees.fnCreateEmployee = function(employeeName, employeeStatus){
  let employee = {"name":employeeName, "status": employeeStatus};
  return employee;
}

// making the file usable outside the file itself
module.exports =  employees;
