import React, { useReducer, createContext, useRef, useState } from 'react';
import axios from "axios";

const initialTodos = [
    // {
    //     id: 0,
    //     text: '할 일 0',
    //     done: true
    // },
    // {
    //     id: 1,
    //     text: '할 일 1',
    //     done: true
    // },
    // {
    //     id: 2,
    //     text: '할 일 2',
    //     done: false
    // },
    // {
    //     id: 3,
    //     text: '할 일 3',
    //     done: false
    // }
];


function todoReducer(state, action) {
    let exist = false;

    switch (action.type) {
        case 'CLEAR': // 할 일 초기화
            state = [];
            return state;
        case 'RENDER': // 할 일 렌더링
            return state.concat(action.todo);
        case 'CREATE': // 할 일 항목 추가
            return state.concat(action.todo);
        case 'TOGGLE': // 할 일 완료 체크/해제
            return state.map(todo =>
                todo.id === action.id ? { ...todo, done: !todo.done } : todo
            );
        case 'REMOVE': // 할 일 삭제
            return state.filter(todo => todo.id !== action.id);
        case 'UPDATE':
            return state.map(todo =>
                todo.id === action.id ? { ...todo, text: action.update_text } : todo
            );
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export const TodoStateContext = createContext();
export const TodoDispatchContext = createContext();
export const TodoNextIdContext = createContext();
export const TodoDateContext = createContext();

export function TodoProvider({ children }) {
    const [state, dispatch] = useReducer(todoReducer, initialTodos);
    const nextId = useRef(0);

    return (
        <TodoStateContext.Provider value={state}>
            <TodoDispatchContext.Provider value={dispatch}>
                <TodoNextIdContext.Provider value={nextId}>
                        {children}
                </TodoNextIdContext.Provider>
            </TodoDispatchContext.Provider>
        </TodoStateContext.Provider>
    );
}