import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Plantillas from "./pages/plantillas";
import Ayuda from "./pages/ayuda";
import { Provider } from "./components/provider";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/plantillas" component={Plantillas} />
        <Route path="/ayuda" component={Ayuda} />
      </Switch>
    </Provider>
  );
}

export default App;
