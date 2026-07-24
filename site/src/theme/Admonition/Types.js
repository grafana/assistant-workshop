import React from 'react';
import DefaultAdmonitionTypes from '@theme-original/Admonition/Types';
import useBaseUrl from '@docusaurus/useBaseUrl';

function AssistantTipAdmonition(props) {
  return (
    <div className={'admonition-assistant'}>
      <div className={'icon-container'}>
        <img src={useBaseUrl('/img/grafana.svg')} alt="Grafana icon" />
        </div>
      <div>
        <div className={'heading'}>{props.title}</div>
        <div className={'content'}>{props.children}</div>
      </div>
    </div>
  );
}

const AdmonitionTypes = {
  ...DefaultAdmonitionTypes,

  // Add all your custom admonition types here...
  // You can also override the default ones if you want
  'assistant-tip': AssistantTipAdmonition,
};

export default AdmonitionTypes;
