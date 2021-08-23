import React, { useContext } from "react";
import Context from "./Context";

const redTheme = {
  color: "red"
};

const greenTheme = {
  color: "green"
};

function Content() {
  const { theme, switchTheme } = useContext(Context);

  return (
    <>
      <h1 style={theme}>Hello world</h1>
      <button onClick={() => switchTheme(redTheme)}>Red Theme</button>
      <button onClick={() => switchTheme(greenTheme)}>Green Theme</button>
    </>
  );
}

function Header() {
  console.log("render Header");
  return <h1>Hello CodeSandbox</h1>;
}

class App extends React.Component {
  state = {
    theme: redTheme
  };

  switchTheme = theme => {
    this.setState({ theme });
  };

  render() {
    console.log("render App");
    return (
      <Context.Provider
        value={{ theme: this.state.theme, switchTheme: this.switchTheme }}
      >
        <div className="App">
          <Header />

          <Content />
        </div>
      </Context.Provider>
    );
  }
}

export default App;
