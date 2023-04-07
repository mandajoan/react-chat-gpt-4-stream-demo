import React, { Component } from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
    /* Adapt the colors based on primary prop */
    background: ${(props) => (props.primary ? 'black' : 'white')};
    color: ${(props) => (props.primary ? 'white' : 'black')};
    font-size: 1em;
    margin: 1em;
    padding: 0.25em 1em;
    border: 2px solid black;
    border-radius: 3px;
    max-width: 300px;
    &:hover {
        background: ${(props) => (props.primary ? 'white' : 'black')};
        color: ${(props) => (props.primary ? 'black' : 'white')};
    }
    &:disabled {
        border: 1px solid #999999;
        background-color: #cccccc;
        color: #666666;
    }
`
export class Button extends Component {
    render() {
        return (
            <StyledButton
                primary={this.props.primary}
                onClick={this.props.onClickHandler}
                disabled={this.props.disabled}
            >
                {this.props.buttonText}
            </StyledButton>
        )
    }
}