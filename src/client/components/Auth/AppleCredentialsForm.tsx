import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Button from '../shared/Button';
import LargeInput from '../shared/LargeInput';
import colors from '../../configs/colors';

export type AppleCredentials = {
  appleId: string;
  password: string;
};

type Props = {
  onSubmit?: (creds: AppleCredentials) => void;
};

type State = AppleCredentials;

export default class AppleCredentialsForm extends React.Component<Props, State> {
  state = {
    appleId: '',
    password: '',
  };

  _handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      [e.target.name]: e.target.value,
    } as any);
  };

  _handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { appleId, password } = this.state;

    this.props.onSubmit && this.props.onSubmit({
      appleId,
      password,
    });
  };

  render() {
    return (
      <div>
        <form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.subtitle)}>Apple ID</h4>
          <LargeInput
            value={this.state.appleId}
            name="appleId"
            autoFocus
            onChange={this._handleChange}
          />
          <h4 className={css(styles.subtitle)}>App-specific Password</h4>
          <LargeInput
            value={this.state.password}
            name="password"
            type="password"
            onChange={this._handleChange}
          />
          <p className={css(styles.caption)}>
            <a className={css(styles.link)} href="https://support.apple.com/en-us/HT204397" target="blank">
              How do I create an Apple app-specific password?
            </a>
          </p>
          <div className={css(styles.buttons)}>
            <Button large variant="secondary" type="submit">
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },
  buttons: {
    margin: '20px 0 0 0',
  },
  caption: {
    marginTop: 24,
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer',
    color: colors.primary,
    textDecoration: 'underline',
  },
});
