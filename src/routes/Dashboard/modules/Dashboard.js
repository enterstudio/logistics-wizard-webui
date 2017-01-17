import { call, take, put, select } from 'redux-saga/effects';
import api from 'services';
import { demoSelector } from 'modules/demos';

export const dashboardSelector = state => state.dashboard;

// ------------------------------------
// Constants
// ------------------------------------
export const GET_ADMIN_DATA = 'Dashboard/GET_ADMIN_DATA';
export const SIMULATE_STORM = 'Dashboard/SIMULATE_STORM';
export const SELECT_MARKER = 'Dashboard/SELECT_MARKER';
export const ADMIN_DATA_RECEIVED = 'Dashboard/ADMIN_DATA_RECEIVED';
export const STORM_RECEIVED = 'Dashboard/STORM_RECEIVED';
export const RECOMMENDATIONS_RECEIVED = 'Dashboard/RECOMMENDATIONS_RECEIVED';
export const ACKNOWLEDGE_RECOMMENDATAION = 'Dashboard/ACKNOWLEDGE_RECOMMENDATAION';

// ------------------------------------
// Actions
// ------------------------------------
export const selectMarker = (type, data) => ({
  type: SELECT_MARKER,
  payload: {
    type,
    data,
  },
});

export const getAdminData = (guid) => ({
  type: GET_ADMIN_DATA,
  guid,
});

export const adminDataReceived = (payload) => ({
  type: ADMIN_DATA_RECEIVED,
  payload,
});

export const simulateWeather = () => ({
  type: SIMULATE_STORM,
});

export const stormReceived = payload => ({
  type: STORM_RECEIVED,
  payload,
});

export const recommendationsReceived = payload => ({
  type: RECOMMENDATIONS_RECEIVED,
  payload,
});

export const acknowledgeRecommendation = (recommendationId) => ({
  type: ACKNOWLEDGE_RECOMMENDATAION,
  payload: {
    recommendationId,
  },
});

export const actions = {
  selectMarker,
  getAdminData,
  adminDataReceived,
  stormReceived,
  recommendationsReceived,
  acknowledgeRecommendation,

};

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SELECT_MARKER]: (state, action) => ({
    ...state,
    infoBox: action.payload,
  }),
  [ADMIN_DATA_RECEIVED]: (state, action) => ({
    ...state,
    ...action.payload,
  }),
  [STORM_RECEIVED]: (state, action) => ({
    ...state,
    weather: [action.payload],
  }),
  [RECOMMENDATIONS_RECEIVED]: (state, action) => {
    console.log('state: ', state);
    state.weather[0].recommendations = [action.payload];
    return state;
  },
};

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  infoBox: {
    type: 'hidden',
    data: {},
  },
  shipments: [],
  retailers: [],
  'distribution-centers': [],
  weather: [],
};

export const dashboardReducer = (state = initialState, action) => {
  const handler = ACTION_HANDLERS[action.type];

  return handler ? handler(state, action) : state;
};
export default dashboardReducer;

// ------------------------------------
// Sagas
// ------------------------------------

export function *watchGetAdminData() {
  while (true) {
    yield take(GET_ADMIN_DATA);
    const demoState = yield select(demoSelector);

    try {
      const adminData = yield call(api.getAdminData, demoState.token);
      yield put(adminDataReceived(adminData));
    }
    catch (error) {
      console.log('Failed to retrieve dashboard data');
      console.error(error);
      // yield put(getAdminDataFilure(error));
    }
  }
}

export function *watchSimulateStorm() {
  while (true) {
    yield take(SIMULATE_STORM);
    const demoState = yield select(demoSelector);

    try {
      const recommendations = yield call(api.simulateStorm, demoState.token);
      yield put(stormReceived(recommendations));
    }
    catch (error) {
      console.log('Failed to retrieve recommendations from simulating storm');
      console.error(error);
    }
  }
}

export function *watchAcknowledgeRecommendation() {
  while (true) {
    console.log('watchAcknowledgeRecommendation: ', watchAcknowledgeRecommendation);
    const { payload } = yield take(ACKNOWLEDGE_RECOMMENDATAION);
    console.log('recommendationId: ', payload.recommendationId);
    const demoState = yield select(demoSelector);

    try {
      const acknowledgeResponse =
        yield call(api.postAcknowledgeRecommendation, demoState.token, payload.recommendationId);
      console.log('acknowledgeResponse: ', acknowledgeResponse);
      const recommendations = yield call(api.getRecommendations, demoState.token);
      console.log('recommendations: ', recommendations);
      yield put(recommendationsReceived(recommendations));
    }
    catch (error) {
      console.log('Error in acknowledgeRecommendation');
      console.error(error);
    }
  }
}

export const sagas = [
  watchGetAdminData,
  watchSimulateStorm,
  watchAcknowledgeRecommendation,
];
