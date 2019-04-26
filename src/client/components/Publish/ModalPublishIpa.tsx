import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import { connect } from 'react-redux';
import ModalDialog from '../shared/ModalDialog';
import Avatar from '../shared/Avatar';
import Segment from '../../utils/Segment';
import Button from '../shared/Button';
import { Viewer } from '../../types';

type Props = {
  authFlow?: 'save1' | 'save2';
  visible: boolean;
  viewer: Viewer | undefined;
  snackUrl?: string;
  snackProfileUrl?: string;
  onDismiss: () => void;
  onPublish: () => void;
};

class ModalPublishIpa extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (!prevProps.visible && this.props.visible) {
      Segment.getInstance().logEvent('CREATED_USER_SNACK');
    }
  }

  _dismissModal = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }

    Segment.getInstance().logEvent('VIEWED_OWNED_USER_SNACKS');
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
        <h2 className={css(styles.heading)}>Publish to App Store</h2>
        <p className={css(styles.text)}>
          Click the button below to create an iOS app and send to Apple's App Store Connect. This requires you to submit your Apple developer credentials.
        </p>
        <Button
          large
          variant="secondary"
          onClick={this.props.onPublish}
        >
          {'Create iOS app'}
        </Button>
      </ModalDialog>
    );
  }
}

// TODO(jim): We need to plug the user in.
export default connect((state: any) => ({
  authFlow: state.splitTestSettings.authFlow || 'save1',
}))(ModalPublishIpa);

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
