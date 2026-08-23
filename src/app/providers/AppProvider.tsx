import { RouterProvider } from "react-router-dom";
import router from "../router";


function AppProvider(){

 return (
    <RouterProvider router={router}/>
 )

}


export default AppProvider;