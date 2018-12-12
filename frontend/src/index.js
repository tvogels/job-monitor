import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import ApolloClient from 'apollo-boost';
import 'normalize.css/normalize.css';
import React from 'react';
import { ApolloProvider } from "react-apollo";
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import { defaults, resolvers } from './resolvers';
import * as serviceWorker from './serviceWorker';


const client = new ApolloClient({
    uri: "http://vogels-graphql.mlo.k8s.iccluster.epfl.ch:30004/graphql",
    clientState: { defaults, resolvers },
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
