import Vue from 'vue'
import AV from 'leancloud-storage'

var APP_ID = '3PTywO0e1luT1O3qSyRV4TdW-gzGzoHsz';
var APP_KEY = 'DDn2qeOEhtISU0mQwl1J8Tqj';
AV.init({
    appId: APP_ID,
    appKey: APP_KEY
});

var app = new Vue({
    el: '#app',
    data: {
        newTodo: '',
        todoList : [],
        actionType: 'signUp',
        formData:{
            username: '',
            password: ''
        },
        currentUser: null
    },
    created: function () {
        this.currentUser = this.getCurrentUser()
        if(this.currentUser){
            this.queryCurrentUserTodo()
        }
    },
    methods:{
        signUp: function () {
            var user = new AV.User();
            user.setUsername(this.formData.username);
            user.setPassword(this.formData.password);
            user.signUp().then((loginedUser)=>{
                this.currentUser = this.getCurrentUser()
                alert('注册成功！')
            },function (error) {
                alert('已被注册！')
            });
        },
        signIn: function () {
           AV.User.logIn(this.formData.username,this.formData.password).then((loginedUser) => {
               this.currentUser = this.getCurrentUser()
               this.queryCurrentUserTodo()
           },function (error) {
               alert('登录失败！')
           })
        },
        signOut: function () {
          this.currentUser = null
          this.todoList = []
        },
        getCurrentUser: function () {
            let {id,createAt,attributes:{username}} = AV.User.current()
            return {id,username,createAt}
        },
        addTodo: function () {
            this.todoList.push({
                title: this.newTodo,
                createAt: new Date(),
                done: false
            })
          this.newTodo = ''
          this.updateOrSaveTodo()

        },
        removeTodo: function (todo) {
            let index = this.todoList.indexOf(todo)
            this.todoList.splice(index,1)

            this.updateOrSaveTodo()
        },
        saveTodo: function () {
            let jsonString = JSON.stringify(this.todoList)
            var AVTodos = AV.Object.extend('AllTodos')
            var avTodos = new AVTodos()

            var acl = new AV.ACL()
            acl.setReadAccess(AV.User.current(),true)  // 只有这个 user 能读
            acl.setWriteAccess(AV.User.current(),true) // 只有这个 user 能写

            avTodos.set('content',jsonString)
            avTodos.setACL(acl)  // 设置访问控制
            avTodos.save().then((todo)=>{
                this.todoList.id= todo.id
            },function (error) {
                alert('保存失败！')
            })
        },
        updateTodo: function () {
            var todo = AV.Object.createWithoutData('AllTodos', this.todoList.id);
            todo.set('content', JSON.stringify(this.todoList));
            todo.save().then(function (todo) {
                console.log('更新成功！')
            },function (error) {
                alert('更新失败！')
            });
        },
        updateOrSaveTodo: function () {
            if(this.todoList.id){
                this.updateTodo()
            }else{
                this.saveTodo()
            }
        },
        queryCurrentUserTodo: function () {
            let query = new AV.Query('AllTodos')
            let avTodos
            query.find().then((todos)=>{
                for(let i =0; i<todos.length;i++){
                    if(this.todoList.id===todos.id){
                        avTodos = todos[i]
                        break
                    }else{
                        return
                    }
                }
                this.todoList = JSON.parse(avTodos.attributes.content)
                this.todoList.id= avTodos.id
            },function (error) {
                console.log('查询当前用户失败！')
            })
        }
    }
})
