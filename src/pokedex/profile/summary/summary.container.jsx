import { connect } from 'react-redux';

import * as actions from '../../pokedex.actions.js';
import Summary from './summary.jsx';

const stateToProps = (state) => ({
	main: state.pokedex.selected.main,
	general: state.pokedex.selected.general,
	abilities: state.pokedex.selected.abilities,
	baseStats: state.pokedex.selected.base_stats,
	minStats: state.pokedex.selected.min_stats,
	maxStats: state.pokedex.selected.max_stats,
	types: state.pokedex.selected.types,
});

const dispatchToProps = (dispatch) => {
	return { }
}

const Container = connect(
	stateToProps,
	dispatchToProps
)(Summary)

export default Container;