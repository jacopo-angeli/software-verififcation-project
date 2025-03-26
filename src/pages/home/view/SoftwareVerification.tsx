import "./SoftwareVerification.css";

import FirstAssignment from "../components/FirstAssignment/view/FirstAssignment";
import SecondAssignment from "../components/SecondAssignment/view/SecondAssignment";

const SofwareVerificationPage = () => {
	const title = "Software verification exam- University of Padua - A.Y. 25/26"
	return (
		<div className="software-verification-page">
			<h1>{title}</h1>
			<FirstAssignment />
			<hr id="divider"/>
			<SecondAssignment />
		</div>
	);
};

export default SofwareVerificationPage;
