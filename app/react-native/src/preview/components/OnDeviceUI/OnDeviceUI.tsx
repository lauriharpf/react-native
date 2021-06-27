import styled from '@emotion/native';
import { addons } from '@storybook/addons';
import { StoryStore } from '@storybook/client-api';
import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlexStyle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Events from '@storybook/core-events';
import StoryListView from '../StoryListView';
import StoryView from '../StoryView';
import AbsolutePositionedKeyboardAwareView, {
  PreviewDimens,
} from './absolute-positioned-keyboard-aware-view';

import Addons from './addons/Addons';
import {
  getAddonPanelPosition,
  getNavigatorPanelPosition,
  getPreviewPosition,
  getPreviewScale,
} from './animation';
import Navigation from './navigation';
import { PREVIEW } from './navigation/constants';
import Panel from './Panel';

const ANIMATION_DURATION = 300;
const IS_IOS = Platform.OS === 'ios';
// @ts-ignore: Property 'Expo' does not exist on type 'Global'
// eslint-disable-next-line no-underscore-dangle
const getExpoRoot = () => global.Expo || global.__expo || global.__exponent;
export const IS_EXPO = getExpoRoot() !== undefined;
const IS_ANDROID = Platform.OS === 'android';

interface OnDeviceUIProps {
  storyStore: StoryStore;
  url?: string;
  tabOpen?: number;
  isUIHidden?: boolean;
  shouldDisableKeyboardAvoidingView?: boolean;
  keyboardAvoidingViewVerticalOffset?: number;
}

const flex = { flex: 1 };

const Preview = styled.View<{ disabled: boolean }>(flex, ({ disabled, theme }) => ({
  borderLeftWidth: disabled ? 0 : 1,
  borderTopWidth: disabled ? 0 : 1,
  borderRightWidth: disabled ? 0 : 1,
  borderBottomWidth: disabled ? 0 : 1,
  borderColor: disabled ? 'transparent' : theme.previewBorderColor,
}));

const absolutePosition: FlexStyle = { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 };

const useSelectedStory = (storyStore: StoryStore) => {
  const [storyId, setStoryId] = useState(storyStore.getSelection()?.storyId || '');
  const channel = useRef(addons.getChannel());

  useEffect(() => {
    const handleStoryWasSet = ({ storyId: newStoryId }: { storyId: string }) =>
      setStoryId(newStoryId);
    channel.current.on(Events.SET_CURRENT_STORY, handleStoryWasSet);

    return () => {
      channel.current.removeListener(Events.SET_CURRENT_STORY, handleStoryWasSet);
    };
  }, []);

  return storyStore.fromId(storyId);
};

const OnDeviceUI = ({
  storyStore,
  isUIHidden,
  shouldDisableKeyboardAvoidingView,
  keyboardAvoidingViewVerticalOffset,
  tabOpen: initialTabOpen,
}: OnDeviceUIProps) => {
  const [tabOpen, setTabOpen] = useState(initialTabOpen || PREVIEW);
  const [slideBetweenAnimation, setSlideBetweenAnimation] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState<PreviewDimens>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  const story = useSelectedStory(storyStore);
  const animatedValue = useRef(new Animated.Value(tabOpen));

  const handleToggleTab = (newTabOpen: number) => {
    if (newTabOpen === tabOpen) {
      return;
    }
    Animated.timing(animatedValue.current, {
      toValue: newTabOpen,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
    setTabOpen(newTabOpen);
    const isSwipingBetweenNavigatorAndAddons = tabOpen + newTabOpen === PREVIEW;
    setSlideBetweenAnimation(isSwipingBetweenNavigatorAndAddons);

    // close the keyboard opened from a TextInput from story list or knobs
    if (newTabOpen === PREVIEW) {
      Keyboard.dismiss();
    }
  };

  const previewWrapperStyles = [
    flex,
    getPreviewPosition(animatedValue.current, previewDimensions, slideBetweenAnimation),
  ];

  const previewStyles = [flex, getPreviewScale(animatedValue.current, slideBetweenAnimation)];

  return (
    <SafeAreaView
      style={[flex, { paddingTop: IS_ANDROID && IS_EXPO ? StatusBar.currentHeight : 0 }]}
    >
      <KeyboardAvoidingView
        enabled={!shouldDisableKeyboardAvoidingView || tabOpen !== PREVIEW}
        behavior={IS_IOS ? 'padding' : null}
        keyboardVerticalOffset={keyboardAvoidingViewVerticalOffset}
        style={flex}
      >
        <AbsolutePositionedKeyboardAwareView
          onLayout={setPreviewDimensions}
          previewDimensions={previewDimensions}
        >
          <Animated.View style={previewWrapperStyles}>
            <Animated.View style={previewStyles}>
              <Preview disabled={tabOpen === PREVIEW}>
                <StoryView story={story} />
              </Preview>
              {tabOpen !== PREVIEW ? (
                <TouchableOpacity
                  style={absolutePosition}
                  onPress={() => handleToggleTab(PREVIEW)}
                />
              ) : null}
            </Animated.View>
          </Animated.View>
          <Panel style={getNavigatorPanelPosition(animatedValue.current, previewDimensions.width)}>
            <StoryListView storyStore={storyStore} selectedStory={story} />
          </Panel>
          <Panel style={getAddonPanelPosition(animatedValue.current, previewDimensions.width)}>
            <Addons />
          </Panel>
        </AbsolutePositionedKeyboardAwareView>
        <Navigation
          tabOpen={tabOpen}
          onChangeTab={handleToggleTab}
          initialUiVisible={!isUIHidden}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default React.memo(OnDeviceUI);
