import EmployeeList from "./pages/EmployeeList";
import EmployeeCreate from "./pages/EmployeeCreate";


const employeeRoutes=[

{
 path:"/employees",
 element:<EmployeeList/>
},

{
 path:"/employees/create",
 element:<EmployeeCreate/>
}

];


export default employeeRoutes;