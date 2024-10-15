import "./SoftwareVerification.css";

import FirstAssignment from "../components/FirstAssignment/view/FirstAssignment";
import SecondAssignment from "../components/SecondAssignment/view/SecondAssignment";

const SofwareVerificationPage = () => {
	return (
		<div className="software-verification-page">
			<h1>Software verification course</h1>
			<FirstAssignment />
			<hr id="divider"/>
			<SecondAssignment />
		</div>
	);
};

export default SofwareVerificationPage;
