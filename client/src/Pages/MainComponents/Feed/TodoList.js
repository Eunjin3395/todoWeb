import React, { useContext, useState, useEffect } from 'react';
import { TodoStateContext, TodoNextIdContext, TodoDispatchContext, TodoDateContext } from '../TodoContext';
import { DateStateContext, DateDispatchContext } from '../DateContext';
import { format } from 'date-fns';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { AiFillPlusCircle, AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin2Fill } from 'react-icons/ri';
import styles from './TodoList.module.css';
import axios from "axios";

// 할 일 생성
const TodoHead = ({ cat_title, cat_id }) => {
    const todos = useContext(TodoStateContext);
    const dispatch = useContext(TodoDispatchContext);
    const nextId = useContext(TodoNextIdContext)
    const date = useContext(DateStateContext);

    const undoneTasks = todos.filter(todo => !todo.done);
    const [input_text, SetInput_text] = useState('');
    const [isFormed, SetIsFormed] = useState(false);


    const TodoCreate = (e) => {
        e.preventDefault();

        if (input_text === "") { // 입력이 공백인 경우
            SetIsFormed(false)
        } else { // 입력값이 있는 경우
            dispatch({
                type: 'CREATE',
                todo: {
                    id: nextId.current,
                    cat_id: cat_id,
                    text: input_text,
                    done: false
                }
            });

            axios.post('/api/main/todo', {
                cat_id: cat_id,
                todo_cont: input_text,
                todo_date: {
                    year: format(date, 'yyyy'),
                    month: format(date, 'M'),
                    day: format(date, 'd')
                }
            })
                .then((response) => {
                    console.log(response.data);
                })
                .catch((error) => {
                    console.log(error);
                })


            nextId.current += 1;
            SetInput_text('');
            SetIsFormed(false)
        }
    }

    const handleChange = (e) => {
        SetInput_text(e.target.value);
    }

    let form = null;
    if (isFormed === true) {
        form = <div className={styles.input_container}>
            <BsCircle size="19px" color="#BDBDBD" ></BsCircle>
            <form onSubmit={TodoCreate}>
                <input type="text" autoFocus value={input_text} placeholder='입력 후 Enter' onChange={handleChange} className={styles.input_text} />
            </form>
            </div>
    }

    const makeForm = () => {
        SetIsFormed(true);
    }

    return (
        <div>
            <div className={styles.todoCreate}>{cat_title}
                <div className={styles.create_icon} onClick={makeForm}>
                    <AiFillPlusCircle size="22px"></AiFillPlusCircle>
                </div>
            </div>
            {form}
        </div>
    );
}


// 할 일 항목 형태 정의
const TodoItemNew = ({ id, done, text }) => {
    const date = useContext(DateStateContext);
    const dispatch = useContext(TodoDispatchContext);
    const [update_text, SetUpdate_text] = useState(text);
    const [update_mode, Setupdate_mode] = useState(false);

    let icon = null;

    // 할 일 완료/해제
    const onToggle = () => {
        dispatch({ type: 'TOGGLE', id });
        axios.post('/api/main/todo/check', {
            checked: !done,
            todo_id: id,
            todo_date: {
                year: format(date, 'yyyy'),
                month: format(date, 'M')
            }
        });
    };

    if (done === true) {
        icon = <BsCheckCircleFill size="19px" onClick={onToggle}></BsCheckCircleFill>
    } else if (done === false) {
        icon = <BsCircle size="19px" color="#BDBDBD" onClick={onToggle}></BsCircle>
    }

    // 할 일 삭제
    const onRemove = () => {
        dispatch({ type: 'REMOVE', id });
        axios.delete('/api/main/todo', {
            data: {
                todo_id: id,
                todo_date: {
                    year: format(date, 'yyyy'),
                    month: format(date, 'M')
                }
            }
        })
            .then((response) => {
                console.log('[id]', id);
                console.log(response.data);
            })
            .catch((error) => {
                console.log(error);
            })
    }

    // 할 일 수정
    const onChangeUpdateMode = () => {
        Setupdate_mode(true);
    }

    const handleChange = (e) => {
        SetUpdate_text(e.target.value);
    }

    const onUpdate = (e) => {
        e.preventDefault();

        SetUpdate_text(text);
        dispatch({ type: 'UPDATE', id, update_text });
        Setupdate_mode(false);

        axios.put('/api/main/todo', {
            todo_id: id,
            todo_text: update_text,
            todo_date: {
                year: format(date, 'yyyy'),
                month: format(date, 'M')
            }
        })
            .then((response) => {
                console.log('[update result]');
                console.log(response.data);
            })
            .catch((error) => {
                console.log(error);
            })
    }

    // 텍스트 영역 형태 정의: 읽기 모드 or 수정 모드
    let text_form = '';
    if(update_mode){
        text_form = <form onSubmit={onUpdate}>
                        <input type="text" autoFocus value={update_text} onChange={handleChange} className={styles.input_text} />
                    </form>
    }else{
        text_form = <div className={styles.text}>
                        {text}
                    </div>
    }

    return (
        <div className={styles.todoItem_container}>
            <div className={styles.checkBox}>
                {icon}
            </div>
            {text_form}   
            <div className={styles.update} onClick={onChangeUpdateMode}>
                <AiFillEdit size="13px"></AiFillEdit>
            </div>
            <div className={styles.delete} onClick={onRemove}>
                <RiDeleteBin2Fill size="13px"></RiDeleteBin2Fill>
            </div>
        </div>
    );
}


export default function TodoList({ }) {
    const [categories, setCategories] = useState([]);
    const [info, setInfo] = useState('');

    const todoState = useContext(TodoStateContext);
    const dispatch = useContext(TodoDispatchContext);
    const date = useContext(DateStateContext);



    useEffect(() => {
        getCategories();
        getInfo();
        console.log('[todoState]', todoState);
    }, [todoState]);

    useEffect(() => {
        dispatch({
            type: 'CLEAR',

        });
        add_to_state();
        rendering();
    }, [date]);


    async function getCategories() {
        await axios
            .get('/api/main/category')
            .then((response) => {
                setCategories(response.data);
            })
            .catch((error) => {
                console.log(error);
            })
    }

    async function getInfo() {
        let userId = '';
        let year = '';
        let month = '';

        await axios
            .get('/api/main')
            .then((response) => {
                userId = response.data.userId;
                year = parseInt(format(date, 'yyyy'));
                month = parseInt(format(date, 'M'));
            })
            .catch((error) => {
                console.log(error);
            })

        await axios
            .get(`/api/main/todo?userId=${userId}&year=${year}&month=${month}}`)
            .then((response) => {
                setInfo(response.data);
            })
            .catch((error) => {
                console.log(error);
            })
    }

    const add_to_state = () => {

        if (info !== '') {
            for (let i = 0; i < categories.length; i++) {
                (info.todo_list).forEach(todo_list_obj => {
                    if (todo_list_obj.year == format(date, 'yyyy') && todo_list_obj.month == format(date, 'M') && todo_list_obj.day == format(date, 'd')) {

                        (todo_list_obj.categorys).forEach(categorys_obj => {
                            if (categorys_obj.cat_id === categories[i].cat_id) {
                                categorys_obj.todos.forEach(todos => {
                                    dispatch({
                                        type: 'RENDER',
                                        todo: {
                                            id: todos.todo_id,
                                            cat_id: categories[i].cat_id,
                                            text: todos.todo_cont,
                                            done: ((todos.todo_checked === 0) ? false : true)
                                        }
                                    });
                                })
                            }
                        });
                    }

                }
                );
            }
        }
    }


    const rendering = () => {
        const result = [];
        categories.forEach(category => {
            const category_box = [];
            category_box.push(<TodoHead
                key={category.cat_id}
                cat_id={category.cat_id}
                cat_title={category.cat_title}
            />)
            todoState.forEach(todo => {
                if (todo.cat_id === category.cat_id) {
                    category_box.push(<TodoItemNew
                        key={todo.id}
                        id={todo.id}
                        text={todo.text}
                        done={todo.done}
                    />)
                }
            })
            result.push(category_box);
        })
        return result;
    }

    return (
        <div>
            {rendering()}
            {/* {categories && categories.map(category => (
                <TodoHead
                    key={category.cat_id}
                    cat_title={category.cat_title}
                />
            ))} 
            {todoState && todoState.map(todo => (
                <TodoItemNew
                    key={todo.id}
                    id={todo.id}
                    text={todo.text}
                    done={todo.done}
                />
            ))} */}
        </div>
    );
}