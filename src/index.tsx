import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SofwareVerificationPage from "./pages/software-verification/view/SoftwareVerification";
import "./index.css";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="*" element={<SofwareVerificationPage />}></Route>
			</Routes>
		</Router>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
