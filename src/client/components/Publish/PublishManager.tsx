import * as React from 'react';
import nullthrows from 'nullthrows';
import { buildAsync, cancelBuild } from 'snack-build';
import ModalAuthentication from '../Auth/ModalAuthentication';
import ModalEditTitleAndDescription from '../ModalEditTitleAndDescription';
import ModalPublishToProfile from './ModalPublishToProfile';
import ModalSuccessfulPublish from './ModalSuccessfulPublish';
import ModalPublishIpa from './ModalPublishIpa';
import ModalPublishUnknownError from './ModalPublishUnknownError';
import ModalPublishOverwriteError from './ModalPublishOverwriteError';
import ModalPublishing from './ModalPublishing';
import withAuth, { AuthProps } from '../../auth/withAuth';
import { isIntentionallyNamed } from '../../utils/projectNames';
import { SDKVersion } from '../../configs/sdk';
import ModalAppleCredentials from '../Auth/ModalAppleCredentials';
import { AppleCredentials } from '../Auth/AppleCredentialsForm';

const IPA_BUILD_STATUS_CHECK_PERIOD = 60000;

export type PublishModals =
  | 'auth'
  | 'publish-prompt-save'
  | 'publish-edit-name'
  | 'publish-success'
  | 'publish-ipa'
  | 'publish-ipa-apple-credentials'
  | 'publish-ipa-working'
  | 'publish-ipa-success'
  | 'publish-working'
  | 'publish-unknown-error'
  | 'publish-overwrite-experience-error'
  | null;

type PublishOptions = {
  allowedOnProfile?: boolean;
};

type Metadata = { name: string; description: string };

type Props = AuthProps & {
  name: string;
  description: string;
  onSubmitMetadata: (details: Metadata, draft?: boolean) => Promise<void>;
  onPublishAsync: (options: PublishOptions) => Promise<void>;
  currentModal: string | null;
  onShowModal: (name: PublishModals) => void;
  onHideModal: () => void;
  creatorUsername: undefined | string;
  snackId: undefined | string;
  sdkVersion: SDKVersion;
  saveOnInit: boolean;
  publishIpaOnInit: boolean;
  loadedEditor: boolean;
  children: (
    options: {
      onPublishAsync: () => Promise<void>;
      isPublishing: boolean;
    }
  ) => React.ReactNode;
};

type State = {
  isPublishInProgress: boolean;
  isPublishing: boolean;
  isPublishingIPA: boolean;
  buildId?: string;
  hasShownEditNameDialog: boolean;
};

class PublishManager extends React.Component<Props, State> {
  state: State = {
    isPublishInProgress: false,
    isPublishing: false,
    isPublishingIPA: false,
    hasShownEditNameDialog: false,
  };

  _waitTimerId?: any;

  _publishWithOptionsAsync = async (options: PublishOptions) => {
    this.setState({ isPublishing: true });

    try {
      await this.props.onPublishAsync(options);
    } catch (e) {
      if (/Experience .+ already exists/.test(e.message)) {
        this.props.onShowModal('publish-overwrite-experience-error');
      } else {
        this.props.onShowModal('publish-unknown-error');
      }

      throw e;
    } finally {
      this.setState({ isPublishing: false });
    }
  };

  _handleSaveToProfile = async () => {
    const isLoggedIn = Boolean(this.props.viewer);

    if (isLoggedIn) {
      // Show a spinner so we dismiss the auth modal
      this.props.onShowModal('publish-working');

      this._handlePublishAsync();
    } else {
      this.props.onShowModal('auth');
    }
  };

  _handleStartPublishIPA = () => {
    this.props.onShowModal('publish-ipa-apple-credentials');
  };

  _handlePublishIPA = async (creds: AppleCredentials) => {
    this.setState({ isPublishingIPA: true });

    this.props.onShowModal('publish-ipa-working');

    // TODO: Do IPA publish - using snack-build
    console.log(creds);

    try {
      const buildId = await this._buildOrCheckIPA({}, 'generate');

      if (!buildId) {
        throw new Error('No buildId returned from _buildOrCheckIPA()');
      }

      this.setState({ buildId });

      const { isPublishInProgress } = this.state;

      if (isPublishInProgress) {
        this._waitForIPABuild(buildId);
      } else {
        this._cancelIPABuild(buildId);
      }
    } catch (e) {
      this.props.onShowModal('publish-unknown-error');

      this.setState({ isPublishingIPA: false });
    }
  };

  async _waitForIPABuild(buildId: string) {
    this._clearWaitTimer();

    try {
      const ipaUri = await this._buildOrCheckIPA({ buildId }, 'check');
      const { isPublishInProgress } = this.state;
      if (!isPublishInProgress) {
        // Build was canceled while we were checking on the status
        return;
      }
      if (ipaUri) {
        console.log({ipaUri});
        this.props.onShowModal('publish-success');

        this.setState({
          buildId: undefined,
          isPublishingIPA: false,
        });
      } else {
        // Check status again...
        // NOTE: we don't timeout automatically
        this._waitTimerId = setTimeout(() => {
          this._waitTimerId = null;
          this._waitForIPABuild(buildId);
        }, IPA_BUILD_STATUS_CHECK_PERIOD);
      }
    } catch (e) {
      this.props.onShowModal('publish-unknown-error');

      this.setState({
        buildId: undefined,
        isPublishingIPA: false,
      });
    }
  }

  _clearWaitTimer() {
    if (this._waitTimerId) {
      clearTimeout(this._waitTimerId);
      this._waitTimerId = null;
    }
  }

  async _buildOrCheckIPA(options: {iconUri?: string, splashImageUri?: string, buildId?: string}, mode: ('generate' | 'check')): Promise<string | undefined> {
    const {iconUri, splashImageUri, buildId} = options;
    const buildMode = mode === 'generate';

    const { name, description, sdkVersion } = this.props;

    const manifest = {
      name,
      description,
      sdkVersion,
      slug: `${name.toLowerCase().replace(/([^a-zA-Z0-9\-]+)/g, '-')}`,
      privacy: "public",
      version: "1.0.0",
      orientation: "portrait",
      dependencies: ["expo"],
      platforms: ["ios", "android"],
      android: {
        package: `org.code.studio.app_${name.toLowerCase().replace(/([^a-zA-Z0-9\_]+)/g, '_')}`,
        permissions: [],
        versionCode: 1
      },
      ios: {
        bundleIdentifier: `org.code.studio.app.${name.toLowerCase().replace(/([^a-zA-Z0-9\-]+)/g, '-')}`, // TODO: fix! "org.code.studio.app.<%- projectId.toLowerCase().replace(/([^a-zA-Z0-9\-]+)/g, '-') %>",
        buildNumber: "1"
      }
    };

    if (buildMode) {
      return this._buildIPA(manifest);
    } else if (buildId) {
      return this._checkIPA(manifest, buildId);
    }
    throw new Error(`_buildOrCheckIPA called with mode ${mode} without buildId`);
  }

  async _buildIPA(manifest: any): Promise<string> {
    const result = await buildAsync(manifest, {
      platform: 'ios',
      mode: 'create',
      isSnack: true,
      sdkVersion: this.props.sdkVersion,
      user: { idToken: this.props.getToken(), sessionSecret: this.props.getSessionSecret() },
      expoApiUrl: nullthrows(process.env.API_SERVER_URL),
    });
    const {id} = result;
    return id;
  }

  async _checkIPA(manifest: any, buildId: string): Promise<string | undefined> {
    const result = await buildAsync(manifest, {
      platform: 'ios',
      mode: 'status',
      current: false,
      user: { idToken: this.props.getToken(), sessionSecret: this.props.getSessionSecret() },
      expoApiUrl: nullthrows(process.env.API_SERVER_URL),
    });
    const {jobs = []} = result;
    const job = jobs.find((job: any) => buildId && job.id === buildId);
    if (!job) {
      throw new Error(`IPA build not found: ${buildId}`);
    }
    if (job.status === 'finished') {
      return job.artifactId
        ? `${nullthrows(process.env.API_SERVER_URL)}/artifacts/${job.artifactId}`
        : job.artifacts.url;
    } else if (job.status === 'errored') {
      throw new Error(`IPA build failed: Job status: ${job.status}`);
    } else {
      // In-progress, return undefined
      return;
    }
  }

  _cancelIPABuild(buildId: string): Promise<void> {
    this.setState({
      buildId: undefined,
      isPublishingIPA: false,
    });
    return cancelBuild(
      {
        user: { idToken: this.props.getToken(), sessionSecret: this.props.getSessionSecret() },
        expoApiUrl: nullthrows(process.env.API_SERVER_URL),
      },
      buildId
    );
  }

  _handleSubmitMetadata = async (details: Metadata) => {
    // Save the new name and description, then publish the snack
    await this.props.onSubmitMetadata(details, false);
    await this._handlePublishAsync();
  };

  _handlePublishAsync = async () => {
    // When the publish flow starts, we set this so we know if we need to show the modals
    this.setState({ isPublishInProgress: true });

    const isLoggedIn = Boolean(this.props.viewer);

    if (
      // Ask for name if name is empty
      !this.props.name ||
      // Or if the name was a generated name and we haven't asked for a name previously
      (!isIntentionallyNamed(this.props.name) && !this.state.hasShownEditNameDialog)
    ) {
      this.props.onShowModal('publish-edit-name');
      this.setState({ hasShownEditNameDialog: true });
    } else {
      if (isLoggedIn) {
        const { publishIpaOnInit } = this.props;
        // If user is logged in, save the snack to profile
        await this._publishWithOptionsAsync({
          allowedOnProfile: true,
        });

        this.props.onShowModal(publishIpaOnInit ? 'publish-ipa': 'publish-success');
      } else {
        // If user is a guest, publish and prompt to save to profile
        await this._publishWithOptionsAsync({
          allowedOnProfile: false,
        });

        this.props.onShowModal('publish-prompt-save');
      }
    }
  };

  _handlePublishAbort = () => {
    this.props.onHideModal();

    // When publish flow ends, we don't need to show any modals
    this.setState({ isPublishInProgress: false });
  };

  _handlePublishIPAAbort = () => {
    const { buildId } = this.state;
    if (buildId) {
      this._cancelIPABuild(buildId);
    }

    this._handlePublishAbort();
  };

  componentDidUpdate(prevProps: Props) {
    // console.log(`PublishManager componentDidUpdate - ${JSON.stringify(this.props, null, 2)}`);
    const { loadedEditor: prevLoadedEditor } = prevProps;
    const { saveOnInit, loadedEditor, publishIpaOnInit } = this.props;

    if (saveOnInit && loadedEditor && !prevLoadedEditor) {
      // For IPA publish, skip the edit name dialog even if not intentionally named
      this.setState({
        hasShownEditNameDialog: publishIpaOnInit,
        isPublishInProgress: true
      }, this._handleSaveToProfile);
    }
  }

  render() {
    const { snackId, viewer, name, description, currentModal, children } = this.props;
    const { isPublishInProgress } = this.state;

    return (
      <React.Fragment>
        {children({
          onPublishAsync: this._handlePublishAsync,
          isPublishing: this.state.isPublishing,
        })}
        <ModalEditTitleAndDescription
          visible={isPublishInProgress && currentModal === 'publish-edit-name'}
          title="Save your Snack"
          action={this.state.isPublishing ? 'Saving…' : 'Save'}
          isWorking={this.state.isPublishing}
          name={name}
          description={description}
          onSubmit={this._handleSubmitMetadata}
          onDismiss={this._handlePublishAbort}
        />
        <ModalAuthentication
          visible={isPublishInProgress && currentModal === 'auth'}
          onComplete={this._handleSaveToProfile}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishToProfile
          visible={isPublishInProgress && currentModal === 'publish-prompt-save'}
          snackUrl={snackId ? `https://snack.expo.io/${snackId}` : undefined}
          onPublish={this._handleSaveToProfile}
          isPublishing={this.state.isPublishing}
          onDismiss={this._handlePublishAbort}
        />
        <ModalSuccessfulPublish
          visible={isPublishInProgress && currentModal === 'publish-success'}
          viewer={viewer}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishIpa
          visible={isPublishInProgress && currentModal === 'publish-ipa'}
          viewer={viewer}
          onPublishIPA={this._handleStartPublishIPA}
          onDismiss={this._handlePublishAbort}
        />
        <ModalAppleCredentials
          visible={isPublishInProgress && currentModal === 'publish-ipa-apple-credentials'}
          onSubmit={this._handlePublishIPA}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishing
          visible={isPublishInProgress && currentModal === 'publish-ipa-working'}
          title="Creating iOS App Store Package"
          onDismiss={this._handlePublishIPAAbort}
        />
        <ModalPublishUnknownError
          visible={isPublishInProgress && currentModal === 'publish-unknown-error'}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishing
          visible={isPublishInProgress && currentModal === 'publish-working'}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishOverwriteError
          visible={isPublishInProgress && currentModal === 'publish-overwrite-experience-error'}
          slug={name}
          username={viewer && viewer.username}
          onEditName={() => this.props.onShowModal('publish-edit-name')}
          onDismiss={this._handlePublishAbort}
        />
      </React.Fragment>
    );
  }
}

export default withAuth(PublishManager);
