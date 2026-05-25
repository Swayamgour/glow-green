import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "../Redux/api";

const ProtectedRoute = ({ children }) => {

    const token = localStorage.getItem("token");

    // No token
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const {
        data: currentUser,
        isLoading,
        isError
    } = useGetMeQuery();

    console.log(currentUser);

    // Loading Screen
    if (isLoading) {

        return (

            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "20px",
                    fontWeight: "600"
                }}
            >
                Loading...
            </div>

        );

    }

    // API Failed / Invalid Token
    if (isError || !currentUser) {

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;

    }

    // Success
    return children;

};

export default ProtectedRoute;