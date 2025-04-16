import ReactDOM from "react-dom/client";
import "./index.css";
import { Editor, type OnMount } from "@monaco-editor/react";
import { useRef } from "react";

function App() {
	// Extract the type of the editor from the OnMount prop
	type IStandaloneCodeEditor = Parameters<OnMount>[0];

	const monacoRef = useRef<IStandaloneCodeEditor | null>(null);

	return (
		<div>
			<header className="w-full bg-[#1e1e1e] text-white px-6 py-4 flex items-center justify-between shadow-md z-50">
				<h1 className="text-xl font-semibold">My WebApp</h1>
				<div className="flex items-center gap-4">
					<button
						onClick={() => {
							monacoRef.current?.focus();
							monacoRef.current?.trigger('anyString', 'editor.action.quickCommand', {
								initialSearch: 'Initial search term',
							  });
						}}
						className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-sm px-3 py-1 rounded-md transition"
					>
						F1
					</button>
				</div>
			</header>
			<Editor
				height="100dvh"
				width="100dvw"
				theme="vs-dark"
				value={"test"}
				onMount={(editor, monaco) => {
					monacoRef.current = editor;
					// Add actions
					editor.addAction({
						id: "run-code",
						label: "Run Code",
						contextMenuOrder: 2,
						contextMenuGroupId: "1_modification",
						keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
						run: () => {
							console.log("ciao");
						},
					});
				}}
			/>
		</div>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
