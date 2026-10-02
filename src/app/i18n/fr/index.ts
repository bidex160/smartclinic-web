import type { Dictionary } from '../types';
import common from './common';
import home from './home';
import auth from './auth';
import dashboard from './dashboard';
import care from './care';
import booking from './booking';
import passport from './passport';
import kids from './kids';

const all: Dictionary = { ...common, ...home, ...auth, ...dashboard, ...care, ...booking, ...passport, ...kids };

export default all;
