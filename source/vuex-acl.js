"use strict"

class Acl {

    init(router, permissions, fail, store) {
        this.router = router
        this.store = store
        this.permissions = this.clearPermissions(permissions)
        this.fail = fail
    }

    check(permission) {
        
        if (permission === undefined)
            return false
        this.permissions = this.clearPermissions(this.store.state.acl_current)
        const permissions = (permission.indexOf('|') !== -1) ? permission.split('|') : [permission]
            
        return this.findPermission(permissions) !== undefined;
    }

    findPermission(pem) {
        return pem.find((permission) => {
            const needed = (permission.indexOf('&') !== -1) ? permission.split('&') : permission
            if (Array.isArray(needed))
                return needed.every( need => (this.permissions.indexOf(need) !== -1) )

            return this.permissions.indexOf(needed) !== -1
        })
    }

    clearPermissions(permissions) {
        if (permissions.indexOf('&') !== -1)
            permissions = permissions.split('&')

        return Array.isArray(permissions) ? permissions : [permissions]
    }

    set router(router) {
        router.beforeEach((to, from, next) => {
            if(to.meta.permission === 'public')
                return next()

            let fail = to.meta.fail || this.fail || from.fullPath

            if (this.store.state.acl_current.length === 0) {
                const watcher = this.store.watch(this.store.getters.aclLoaded, acl => {
                    watcher()
                    if (!this.check(to.meta.permission)) return next(fail)
                    else return next()
                })
            } else if (!this.check(to.meta.permission)) return next(fail)
            else return next()
        })
    }
}

let acl = new Acl()

Acl.install = (Vue, {router, init, fail, store}) => {

    acl.init(router, init, fail, store)

    Vue.prototype.$can = (permission) => acl.check(permission)

}

export default Acl
