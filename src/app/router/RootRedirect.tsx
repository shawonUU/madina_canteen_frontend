import { Navigate } from "react-router-dom";
import { getToken } from "../../services/storage";

const RootRedirect = () => {
    const token = getToken();

    return token ? (
        <Navigate to="/dashboard" replace />
    ) : (
        <Navigate to="/login" replace />
    );
};

export default RootRedirect;