// import gql from "graphql-tag";

export const resolvers = {
    // Job: {
    //     isSelected: () => false
    // },
    // Mutation: {
    //     toggleJob: (_, variables, { cache, getCacheKey }) => {
    //         const id = getCacheKey({ __typename: 'Job', id: variables.id })
    //         const fragment = gql`
    //         fragment selected on Job {
    //             isSelected @client
    //         }
    //         `;
    //         const job = cache.readFragment({ fragment, id });
    //         // const data = { ...job, isSelected: !job.isSelected };
    //         // cache.writeData({ id, data });
    //         return { __typename: 'Job', id: variables.id, isSelected: !job.isSelected };
    //     },
    //   },
};

export const defaults = {};
