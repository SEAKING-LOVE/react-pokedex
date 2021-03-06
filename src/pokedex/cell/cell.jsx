import React, { Component } from 'react';
import {connect} from "react-redux";
import Profile from '../profile/profile.container.jsx';
import './cell.scss';
import './sprites.scss';

// this.props = {
// 	onClick: () => {},
// 	pokemon: {},
// 	size: 0,
// 	margin: 0,
// 	selected: false,
// 	offsetLeft: 0,
// 	expandWidth: 0,
// 	offsetLeft: 0
// };

class Cell extends Component {
	renderPreview() {
		const style = {
			width: `${this.props.size}px`,
			height: `${this.props.size}px`
		}
		return <div 
			className={`preview ${this.props.selected ? 'active' : ''}`}
			style={style}
			onClick={this.props.onClick}>
				<div className='pkiContainer'>
					<i className={`pki ${this.props.pokemon.unique_id}`}></i>
				</div>
				
				<span>{this.leadingZeros(this.props.pokemon.national_id)}</span>
			</div>	
	}
	renderProfile() {
		const style = {
			left: `-${this.props.offsetLeft}px`,
			width: this.props.expandWidth
		};
		const content = this.props.selected ? <Profile pokemon={this.props.pokemon}/> : <div></div>;
		return <div 
			className={`profileContainer ${this.props.selected ? 'expanded' : ''}`}
			style={style}>
			{content}
		</div>
	}
	leadingZeros(num) {
		const size = 3;
		const newNum = '000' + num;
		return newNum.substr(newNum.length - size);
	}
	cellContainerStyle() {
		return {
			width: `${this.props.size}px`,
			margin: `${this.props.margin}px`
		};
	}
	render() {
		const style=this.cellContainerStyle();

		return <div key={this.props.pokemon.unique_id} className='cell' style={style}>
			{this.renderPreview()}
			{this.renderProfile()}
		</div>
	}
}

export default Cell;