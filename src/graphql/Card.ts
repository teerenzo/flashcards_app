import { extendType,intArg,nonNull,objectType, stringArg } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";

export const Card = objectType({
    name:"Card",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("title");
        t.nonNull.string("description");
        t.nonNull.string("status");
        t.field("postedBy", {   // 1
            type: "User",
            resolve(parent, args, context) {  // 2
                return context.prisma.card
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
    },
})

export const CardQuery = extendType({  
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field("flashcards", {   
            type: "Card",
            resolve(parent, args, context, info) {   
                return context.prisma.card.findMany();
            },
        });
    },
});

export const CardMutation = extendType({
    type:"Mutation",
    definition(t) {
        t.nonNull.field("addCard",{
          type:"Card",
          args:{
            title:nonNull(stringArg()),
            description:nonNull(stringArg()),
            
          },
           resolve(parent,args,context){
            const {title,description} = args;
            const { userId } = context;

            if (!userId) {  
                throw new Error("Cannot post without logging in.");
            }

           const card =  context.prisma.card.create({
            data:{
                title,
                description,
                postedBy:{connect:{id:userId}}
            }
           })
            return card
          }
        })
        t.nonNull.field("deleteCard",{
            type:objectType({
                name:"Response",
                definition(t) {
                    t.string("response")
                },
              }),
            args:{
                id:nonNull(intArg())
            },
           async resolve(parent,args,context){

            const { userId } = context;
  console.log(userId)
            if (!userId) {  
                throw new Error("Cannot DELETE without logging in.");
            }

            const res = await context.prisma.card.findFirst({
                where: {
                  id:args.id
                }
              })
              if(!res){
                return {
                    response:`Card with ${args.id} is not exist`
                }
              }
              if(res?.userId!==userId){
                return {
                    response:"Not Allowed to delete this Card"
                }
              }

            await context.prisma.card.delete({
                    where: {
                      id:args.id
                    }
                  })


                  return {
                    response:"Card Delete"
                  }


            }
        })
        t.nonNull.field("updateCard",{
            type:objectType({
                name:"Update",
                definition(t) {
                    t.string("response")
                },
              }),
            args:{
                id:nonNull(intArg()),
                title:nonNull(stringArg()),
                description:nonNull(stringArg()),
            },
           async resolve(parent,args,context){

            const { userId } = context;

            if (!userId) {  
                throw new Error("Cannot Update without logging in.");
            }   
            
            const res = await context.prisma.card.findFirst({
                where: {
                  id:args.id
                }
              })

            if(!res){
                return {
                    response:`Card with ${args.id} is not exist`
                }
              }
              if(res?.userId!==userId){
                return {
                    response:"Not Allowed to delete this Card"
                }
              }
            const card = await context.prisma.card.update({
                where: {
                  id:args.id
                },
                data: {
                  title:args.title,
                  description:args.description
                }
              })

                  return {
                    response:"Data Updated"

                  }


            }
        })
    },
})