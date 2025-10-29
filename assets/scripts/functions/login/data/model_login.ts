import { VM } from "../../../../libs/hook/ViewModel"

class login {
    name: string = "nickname"
    password: string = "password"

}

let model_login = new login()


VM.add(model_login, "login")