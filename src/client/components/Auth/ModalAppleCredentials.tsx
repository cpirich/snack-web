import * as React from 'react';
import ModalDialog from '../shared/ModalDialog';
import AppleCredentialsForm, {AppleCredentials} from './AppleCredentialsForm';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit?: (creds: AppleCredentials) => void;
};

type State = {
  error: boolean;
};

export default class ModalAppleCredentials extends React.Component<Props, State> {
  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Apple Developer Login">
        <AppleCredentialsForm onSubmit={this.props.onSubmit} />
      </ModalDialog>
    );
  }
}
