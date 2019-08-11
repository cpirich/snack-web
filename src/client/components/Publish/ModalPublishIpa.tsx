import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ModalDialog from '../shared/ModalDialog';
import Avatar from '../shared/Avatar';
import Button from '../shared/Button';
import { Viewer } from '../../types';

type Props = {
  visible: boolean;
  viewer: Viewer | undefined;
  onDismiss: () => void;
  onPublishIPA: () => void;
};

export default class ModalPublishIpa extends React.PureComponent<Props> {
  _dismissModal = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
  };

  render() {
    const picture = this.props.viewer ? this.props.viewer.picture : null;

    return (
      <ModalDialog visible={this.props.visible} onDismiss={this.props.onDismiss}>
        {picture ? (
          <div className={css(styles.avatar)}>
            <Avatar source={picture} size={80} />
          </div>
        ) : null}
        <h2 className={css(styles.heading)}>Create iOS App Store Package</h2>
        <p className={css(styles.text)}>
          Click the button below to create an iOS App Store Package and send it to Apple's App Store Connect.
        </p>
        <p className={css(styles.text)}>
          This requires you to submit your Apple developer credentials.
        </p>
        <Button
          large
          variant="secondary"
          onClick={this.props.onPublishIPA}
        >
          Continue
        </Button>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  avatar: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: '24px',
    textAlign: 'center',
  },
  text: {
    marginBottom: 24,
    fontSize: '16px',
    padding: '0 24px 0 24px',
    lineHeight: '22px',
    textAlign: 'center',
  },
});
