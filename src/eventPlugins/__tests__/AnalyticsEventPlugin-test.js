/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

require('mock-modules')
    .dontMock('AnalyticsEventPluginFactory')
    .dontMock('EventPluginHub')
    .dontMock('React')
    .dontMock('ReactEvent')
    .dontMock('ReactEventTopLevelCallback')
    .dontMock('ReactInstanceHandles')
    .dontMock('ReactTestUtils');

var AnalyticsEventPluginFactory = require('AnalyticsEventPluginFactory');
var EventPluginHub = require('EventPluginHub');
var mocks = require('mocks');
var React = require('React');
var ReactEvent = require('ReactEvent');
var ReactEventTopLevelCallback = require('ReactEventTopLevelCallback');
var ReactTestUtils = require('ReactTestUtils');

ReactEvent.ensureListening(false, ReactEventTopLevelCallback);

describe('AnalyticsEventPlugin', function() {
  it('should count events correctly', function() {
    var numClickEvents = 5;
    var numDoubleClickEvents = 7;
    var TEST_ANALYTICS_ID = 'test_analytics_id';
    var TestValidEvents = React.createClass({
      render: function() {
        return (
          <div ref="testDiv"
            data-analytics-id={TEST_ANALYTICS_ID}
            data-analytics-events='click,doubleClick'>
            Test
          </div>
        );
      }
    });
    var renderedComponent =
      ReactTestUtils.renderIntoDocument(<TestValidEvents />);

    var cb = mocks.getMockFunction().mockImplementation(
      function(analyticsData) {
        expect(Object.keys(analyticsData).length).toBe(1);
        expect(Object.keys(analyticsData[TEST_ANALYTICS_ID]).length).toBe(2);
        expect(analyticsData[TEST_ANALYTICS_ID].click).toBe(numClickEvents);
        expect(analyticsData[TEST_ANALYTICS_ID].doubleClick).toBe(
          numDoubleClickEvents
        );
      }
    );

    EventPluginHub.injection.injectEventPluginsByName({
      AnalyticsEventPlugin: AnalyticsEventPluginFactory.createAnalyticsPlugin(
        cb
      )
    });

    // Simulate some clicks
    for (var i = 0; i < numClickEvents; i++) {
      ReactTestUtils.Simulate.click(renderedComponent.refs.testDiv);
    }
    // Simulate some double clicks
    for (i = 0; i < numDoubleClickEvents; i++) {
      ReactTestUtils.Simulate.doubleClick(renderedComponent.refs.testDiv);
    }
    // Simulate some other events not being tracked for analytics
    ReactTestUtils.Simulate.focus(renderedComponent.refs.testDiv);

    window.mockRunTimersOnce();
    expect(cb).toBeCalled();

  });

  it('error non no callback', function() {
    var error = false;
    try {
      EventPluginHub.injection.injectEventPluginsByName({
        AnalyticsEventPlugin: AnalyticsEventPluginFactory.createAnalyticsPlugin(
          null
        )
      });
    } catch(e) {
      error = true;
    }

    expect(error).toBe(true);
  });

  it('error on invalid analytics events', function() {
    var TestInvalidEvents = React.createClass({
      render: function() {
        return (
          <div ref="testDiv"
            data-analytics-id='test_invalid_events'
            data-analytics-events='click,123'>
            Test
          </div>
        );
      }
    });
    var renderedComponent =
      ReactTestUtils.renderIntoDocument(<TestInvalidEvents />);

    var cb = mocks.getMockFunction();

    EventPluginHub.injection.injectEventPluginsByName({
      AnalyticsEventPlugin: AnalyticsEventPluginFactory.createAnalyticsPlugin(
        cb
      )
    });

    var error = false;
    try {
      ReactTestUtils.Simulate.click(renderedComponent.refs.testDiv);
    } catch(e) {
      error = true;
    }

    expect(error).toBe(true);
  });
});
