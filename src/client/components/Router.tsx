import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { parse } from 'query-string';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

type Props = {
  data:
    | {
        type: 'success';
        snack: object | null;
      }
    | {
        type: 'error';
        error: {
          message: string;
        };
      }
    | null;
  userAgent: string;
};

export default class Router extends React.Component<Props> {
  _renderRoute = (props: any) => {
    const { data, ...rest } = this.props;
    const isEmbedded = props.location.pathname.split('/')[1] === 'embedded';
    const isPublishIpaUrl = props.location.pathname.split('/')[1] === 'publishipa';
    const isSaveUrl = isPublishIpaUrl || props.location.pathname.split('/')[1] === 'save';

    if (data && data.type === 'success') {
      if (isEmbedded) {
        return (
          <EmbeddedApp
            {...props}
            {...rest}
            query={parse(props.location.search)}
            snack={data.snack}
          />
        );
      }

      return <App {...props} isSaveUrl={isSaveUrl} isPublishIpaUrl={isPublishIpaUrl} {...rest} query={parse(props.location.search)} snack={data.snack} />;
    } else {
      return <NonExistent />;
    }
  };

  render() {
    return (
      <Switch>
        <Route exact path="/embedded/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/embedded/:id" render={this._renderRoute} />
        <Route exact path="/embedded" render={this._renderRoute} />
        <Route exact path="/publishipa/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/publishipa/:id" render={this._renderRoute} />
        <Route exact path="/publishipa" render={this._renderRoute} />
        <Route exact path="/save/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/save/:id" render={this._renderRoute} />
        <Route exact path="/save" render={this._renderRoute} />
        <Route exact path="/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/:id" render={this._renderRoute} />
        <Route exact path="/" render={this._renderRoute} />
        <Route component={NonExistent} />
      </Switch>
    );
  }
}
