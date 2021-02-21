import React, { PureComponent } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';

const ActiveBorder = styled.View<{ active: boolean }>(({ active, theme }) => ({
  backgroundColor: active ? theme.borderColor || '#e6e6e6' : 'transparent',
  height: 3,
}));

const ButtonText = styled.Text<{ active: boolean }>(({ theme, active }) => ({
  color: active ? theme.buttonActiveTextColor || '#444444' : theme.buttonTextColor || '#999999',
  paddingHorizontal: 8,
  paddingVertical: 10,
  fontSize: 11,
}));

interface Props {
  id: number | string;
  active: boolean;
  onPress: (id: number | string) => void;
  testID?: string;
}

export default class Button extends PureComponent<Props> {
  onPress = () => {
    const { onPress, id } = this.props;
    onPress(id);
  };

  render() {
    const { active, children, testID } = this.props;

    return (
      <TouchableOpacity testID={testID} onPress={this.onPress} activeOpacity={0.8}>
        <ButtonText active={active}>{children}</ButtonText>
        <ActiveBorder active={active} />
      </TouchableOpacity>
    );
  }
}
